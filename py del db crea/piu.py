import requests
from bs4 import BeautifulSoup
import pandas as pd
import sqlite3
import time
import re

# Import di Selenium
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC

BASE_URL = "https://www.alimentinutrizione.it"
CATEGORIA_URL = f"{BASE_URL}/tabelle-nutrizionali/ricerca-per-categoria"
CSV_FILE = "alimenti_crea.csv"
SQLITE_DB = "alimenti_crea.sqlite"

def get_alimenti_links_from_category(driver):
    time.sleep(1)  # Attesa per il caricamento dei contenuti
    soup = BeautifulSoup(driver.page_source, 'html.parser')
    
    all_links = soup.find_all("a", href=True)
    urls = []
    for link in all_links:
        href = link["href"]
        # Escludi URL che contengono "ricerca-per-categoria" o "ricerca-per-ordine-alfabetico"
        if href.startswith("/tabelle-nutrizionali/") and \
           "ricerca-per-categoria" not in href and \
           "ricerca-per-ordine-alfabetico" not in href:
            parti = href.strip("/").split("/")
            if len(parti) == 2 and parti[0] == "tabelle-nutrizionali":
                urls.append(BASE_URL + href)
    return list(set(urls))

def parse_alimento(url, category_name):
    """
    Scarica la pagina dell'alimento e ne estrae:
      - Dati della tabella introduttiva (es. categoria, codice, porzione)
      - Nutrienti dalla tabella con classe 'tblmain'
      - Utilizza <h1 class="article-title"> (o altri tag se non disponibile) per il nome
    Viene aggiunto anche il nome della categoria dalla quale proviene l'alimento.
    """
    print(f"Parsing alimento: {url}")
    headers = {'User-Agent': 'Mozilla/5.0'}
    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        print(f"Errore HTTP {response.status_code} per {url}")
        return {}
    soup = BeautifulSoup(response.text, 'html.parser')

    # Estrai il nome dell'alimento: preferiamo <h1 class="article-title">
    titolo = soup.find("h1", class_="article-title")
    if not titolo:
        titolo = soup.find("h2", class_="titolo-dettaglio")
    if not titolo:
        titolo = soup.find("h1")
    nome = titolo.text.strip() if titolo else "Sconosciuto"
    
    data = {"Nome_alimento": nome, "URL": url, "Categoria": category_name}

    # Tabella introduttiva (e.g., con classe "toptable")
    tabella_intro = soup.find("table", class_="toptable")
    if tabella_intro:
        for row in tabella_intro.find_all("tr"):
            celle = row.find_all("td")
            if len(celle) == 2:
                chiave = celle[0].text.strip()
                valore = celle[1].text.strip()
                if chiave:
                    data[chiave] = valore

    # Tabella dei nutrienti principali (classe "tblmain")
    tabella = soup.find("table", class_="tblmain")
    if tabella:
        righe = tabella.find_all("tr")
        for riga in righe:
            celle = riga.find_all("td")
            if len(celle) >= 3:
                chiave = celle[0].text.strip()
                valore_100g = celle[2].text.strip()
                if chiave and valore_100g:
                    data[chiave] = valore_100g
                if len(celle) >= 6:
                    valore_porzione = celle[5].text.strip()
                    if valore_porzione:
                        data[f"{chiave} (per porzione)"] = valore_porzione
    else:
        print("⚠️ Nessuna tabella 'tblmain' trovata in questa pagina")

    return data

def clean_column_name(name, i):
    """
    Pulizia dei nomi delle colonne per essere compatibili con SQLite.
    """
    if not name:
        return f"colonna_{i}"
    name = str(name).strip().replace("\n", " ")
    name = re.sub(r'[^\w\s]', '', name)
    name = re.sub(r'\s+', '_', name)
    if not name[0].isalpha():
        name = f"_{name}"
    name = re.sub(r'[^a-zA-Z0-9_]', '', name)
    return name if name else f"colonna_{i}"

def main():
    all_data = []
    
    # Avvia Selenium
    print("Avvio Selenium...")
    driver = webdriver.Chrome()  # Assicurati che ChromeDriver sia installato
    driver.get(CATEGORIA_URL)
    wait = WebDriverWait(driver, 10)
    
    # Attende il caricamento del menu a tendina; potrebbe essere necessario adattare il selettore se diverso
    try:
        select_element = wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, "select")))
    except Exception as e:
        print(f"Errore nel trovare il menu a tendina: {e}")
        driver.quit()
        return
    dropdown = Select(select_element)
    categories = dropdown.options
    print(f"Trovate {len(categories)} opzioni di categoria.")

    all_urls = []  # Lista di tuple: (nome_categoria, url_alimento)
    for option in categories:
        cat_value = option.get_attribute("value")
        cat_text = option.text.strip()
        # Saltiamo opzioni non utili (placeholder)
        if not cat_value or cat_value.lower() in ["", "seleziona", "tutti", "cerca per categoria"]:
            continue

        print(f"\nSeleziono categoria: {cat_text}")
        dropdown.select_by_value(cat_value)
        time.sleep(2)  # Attendi che la lista si carichi
        urls = get_alimenti_links_from_category(driver)
        print(f"Categoria '{cat_text}': trovati {len(urls)} alimenti")
        for url in urls:
            all_urls.append((cat_text, url))
    
    driver.quit()
    print(f"\nTotale alimenti raccolti (eventuali duplicati inclusi): {len(all_urls)}")
    
    # Rimuovere duplicati basati sull'URL.
    unique_data = {}
    for cat, url in all_urls:
        if url in unique_data:
            # Se il medesimo URL è già presente, aggiungi la categoria, se non già inclusa
            esistente = unique_data[url]
            if cat not in esistente["Categoria"]:
                esistente["Categoria"] += ", " + cat
        else:
            unique_data[url] = {"Categoria": cat, "URL": url}
    # Estraiamo solo gli URL univoci, conservando la categoria combinata
    univoci = [(d["Categoria"], url) for url, d in unique_data.items()]
    print(f"Totale alimenti univoci raccolti: {len(univoci)}")

    # Ora, per ogni URL unico, estrae i dati nutrizionali
    all_data = []
    for idx, (cat, url) in enumerate(univoci):
        try:
            data = parse_alimento(url, cat)
            if data and len(data.keys()) > 2:
                all_data.append(data)
            else:
                print(f"⚠️ Dati insufficienti per {url}")
            print(f"Alimento {idx+1}/{len(univoci)} elaborato.")
            time.sleep(0.5)
        except Exception as e:
            print(f"❌ Errore nel parsing di {url}: {e}")
    
    if not all_data:
        print("❌ Nessun dato recuperato.")
        return
    
    # Creazione del DataFrame e pulizia dei nomi delle colonne
    df = pd.DataFrame(all_data)
    df = df.loc[:, df.columns.notna()]
    df.columns = [clean_column_name(col, i) for i, col in enumerate(df.columns)]
    
    print("\n📊 Colonne finali:")
    for i, col in enumerate(df.columns):
        print(f"{i}: '{col}'")
    print(f"\n📦 Totale alimenti elaborati: {len(df)}")
    print("📝 Anteprima dei dati:")
    print(df.head(3).to_string())
    
    # Salvataggio in CSV
    df.to_csv(CSV_FILE, index=False, encoding="utf-8-sig")
    print(f"\n💾 Dati salvati in {CSV_FILE}")
    
    # Salvataggio in SQLite
    conn = sqlite3.connect(SQLITE_DB)
    try:
        df.to_sql("alimenti", conn, if_exists="replace", index=False,
                  dtype={col:"TEXT" for col in df.columns})
        print(f"💾 Dati salvati in {SQLITE_DB}")
    except Exception as e:
        print(f"❌ Errore nel salvataggio SQLite: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    main()
