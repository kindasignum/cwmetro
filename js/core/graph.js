/* =========================================================
   ГРАФ СВЯЗЕЙ МЕЖДУ СТАНЦИЯМИ
   ========================================================= */

(function (M) {

  // Строим граф смежности из M.lines и M.stationsData.
  // graph[stationId] = Set соседей
  M.graph = {};

  M.stationsData.forEach(s => { M.graph[s.id] = new Set(); });

  for (const lineName in M.lines) {
    const seq = M.lines[lineName];
    for (let i = 0; i < seq.length - 1; i++) {
      M.graph[seq[i]].add(seq[i + 1]);
      M.graph[seq[i + 1]].add(seq[i]);
    }
  }

  // Возвращает все линии, которые напрямую соединяют две станции
  M.getConnectingLines = function (a, b) {
    const result = [];
    for (const lineName in M.lines) {
      const seq = M.lines[lineName];
      for (let j = 0; j < seq.length - 1; j++) {
        if ((seq[j] === a && seq[j + 1] === b) || (seq[j] === b && seq[j + 1] === a)) {
          result.push(lineName);
          break;
        }
      }
    }
    return result;
  };

  // Возвращает все простые пути (без повторов станций) между start и end.
  // Каждый путь — массив шагов { from, to, line }.
  M.findAllPaths = function (startId, endId) {
    const paths = [];
    const visited = new Set();

    function dfs(current, path) {
      if (current === endId) {
        paths.push([...path]);
        return;
      }
      visited.add(current);
      for (const nb of M.graph[current]) {
        if (visited.has(nb)) continue;
        const connecting = M.getConnectingLines(current, nb);
        for (const lineName of connecting) {
          path.push({ from: current, to: nb, line: lineName });
          dfs(nb, path);
          path.pop();
        }
      }
      visited.delete(current);
    }

    dfs(startId, []);
    return paths;
  };

})(window.CatWarMetro = window.CatWarMetro || {});