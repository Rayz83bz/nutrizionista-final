from flask import Flask, render_template_string, request
import sqlite3
import pandas as pd

app = Flask(__name__)
DB_PATH = "alimenti_crea.sqlite"

HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <title>Alimenti CREA</title>
    <style>
        body { font-family: sans-serif; padding: 2rem; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ccc; padding: 0.5rem; text-align: left; }
        input { padding: 0.5rem; width: 300px; margin-bottom: 1rem; }
    </style>
</head>
<body>
    <h1>Alimenti CREA</h1>
    <form method="get">
        <input type="text" name="q" placeholder="Cerca alimento..." value="{{ q }}">
        <button type="submit">Cerca</button>
    </form>
    <table>
        <thead>
            <tr>
                {% for col in columns %}
                    <th>{{ col }}</th>
                {% endfor %}
            </tr>
        </thead>
        <tbody>
            {% for row in rows %}
                <tr>
                    {% for col in columns %}
                        <td>{{ row[col] }}</td>
                    {% endfor %}
                </tr>
            {% endfor %}
        </tbody>
    </table>
</body>
</html>
"""

@app.route("/", methods=["GET"])
def index():
    q = request.args.get("q", "")
    conn = sqlite3.connect(DB_PATH)
    df = pd.read_sql("SELECT * FROM alimenti", conn)
    conn.close()

    if q:
        df = df[df["Nome alimento"].str.contains(q, case=False, na=False)]

    columns = df.columns.tolist()
    rows = df.to_dict(orient="records")

    return render_template_string(HTML_TEMPLATE, columns=columns, rows=rows, q=q)

if __name__ == "__main__":
    app.run(debug=True)
