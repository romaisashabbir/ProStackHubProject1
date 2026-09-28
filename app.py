from flask import Flask, render_template, request, jsonify

app = Flask(__name__)


# =========================
# DIJKSTRA'S ALGORITHM
# =========================

def dijkstra(graph, start, end):

    distances = {}

    previous = {}

    visited = set()

    steps = []

    # Set initial distances
    for node in graph:
        distances[node] = float("inf")
        previous[node] = None

    distances[start] = 0

    while len(visited) < len(graph):

        # Find unvisited node with smallest distance
        current = None
        smallest_distance = float("inf")

        for node in graph:

            if node not in visited and distances[node] < smallest_distance:
                smallest_distance = distances[node]
                current = node

        # No reachable node left
        if current is None:
            break

        visited.add(current)

        # Save step
        steps.append({
            "action": "visit",
            "node": current,
            "distances": distances.copy(),
            "visited": list(visited)
        })

        # Stop if destination reached
        if current == end:
            break

        # Check neighbors
        for neighbor, weight in graph[current]:

            new_distance = distances[current] + weight

            if new_distance < distances[neighbor]:

                distances[neighbor] = new_distance

                previous[neighbor] = current

                steps.append({
                    "action": "update",
                    "from": current,
                    "to": neighbor,
                    "distance": new_distance,
                    "distances": distances.copy(),
                    "visited": list(visited)
                })

    # Build shortest path
    path = []

    current = end

    while current is not None:

        path.append(current)

        current = previous[current]

    path.reverse()

    # No path found
    if not path or path[0] != start:
        path = []

    return {
        "algorithm": "Dijkstra",
        "path": path,
        "distance": None if not path else distances[end],
        "steps": steps,
        "time_complexity": "O((V + E) log V)",
        "space_complexity": "O(V)"
    }


# =========================
# HOME PAGE
# =========================

@app.route("/")
def home():

    return render_template("index.html")


# =========================
# DIJKSTRA API
# =========================

@app.route("/api/dijkstra", methods=["POST"])
def run_dijkstra():

    data = request.get_json()

    graph = data["graph"]

    start = data["start"]

    end = data["end"]

    result = dijkstra(graph, start, end)

    return jsonify(result)


# =========================
# RUN APPLICATION
# =========================

if __name__ == "__main__":

    app.run(debug=True)