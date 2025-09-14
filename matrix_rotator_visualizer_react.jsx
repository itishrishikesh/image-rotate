const { useEffect, useRef, useState } = React;

export default function MatrixRotatorVisualizer() {
  // Helpers
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function generateSequentialMatrix(n) {
    const arr = [];
    let c = 1;
    for (let i = 0; i < n; i++) {
      const row = [];
      for (let j = 0; j < n; j++) row.push(c++);
      arr.push(row);
    }
    return arr;
  }

  function shuffleArray(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function generateActions(n) {
    const acts = [];
    // Reverse rows (swap rows i and n-1-i)
    for (let i = 0; i < Math.floor(n / 2); i++) {
      acts.push({
        type: "swapRows",
        i1: i,
        i2: n - 1 - i,
        desc: `Reverse: swap row ${i} with row ${n - 1 - i}`,
      });
    }

    // Transpose swaps (i,j) <-> (j,i) for j>i
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        acts.push({
          type: "swapCells",
          a: [i, j],
          b: [j, i],
          desc: `Transpose: swap cell (${i},${j}) with (${j},${i})`,
        });
      }
    }

    return acts;
  }

  function deepCopy(mat) {
    return mat.map((r) => r.slice());
  }

  function applyActionToMatrix(mat, action) {
    const m = deepCopy(mat);
    if (!action) return m;
    if (action.type === "swapRows") {
      const tmp = m[action.i1];
      m[action.i1] = m[action.i2];
      m[action.i2] = tmp;
    } else if (action.type === "swapCells") {
      const [i1, j1] = action.a;
      const [i2, j2] = action.b;
      const t = m[i1][j1];
      m[i1][j1] = m[i2][j2];
      m[i2][j2] = t;
    }
    return m;
  }

  // State
  const [n, setN] = useState(3);
  const [initialMatrix, setInitialMatrix] = useState(() => generateSequentialMatrix(3));
  const [matrix, setMatrix] = useState(() => deepCopy(initialMatrix));
  const [actions, setActions] = useState(() => generateActions(3));
  const [index, setIndex] = useState(-1); // -1 = before any action applied
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(600);
  const timerRef = useRef(null);
  const [inputText, setInputText] = useState("");

  // Java code lines (shown for educational highlighting)
  const javaLines = [
    "public class Solution {",
    "    public void rotate(int[][] matrix) {",
    "        // Reverse the matrix vertically",
    "        reverse(matrix);",
    "",
    "        // Transpose the matrix",
    "        for (int i = 0; i < matrix.length; i++) {",
    "            for (int j = i; j < matrix[i].length; j++) {",
    "                int temp = matrix[i][j];",
    "                matrix[i][j] = matrix[j][i];",
    "                matrix[j][i] = temp;",
    "            }",
    "        }",
    "    }",
    "",
    "    private void reverse(int[][] matrix) {",
    "        int n = matrix.length;",
    "        for (int i = 0; i < n / 2; i++) {",
    "            int[] temp = matrix[i];",
    "            matrix[i] = matrix[n - 1 - i];",
    "            matrix[n - 1 - i] = temp;",
    "        }",
    "    }",
    "}",
  ];

  // Update actions when n changes
  useEffect(() => {
    setActions(generateActions(n));
  }, [n]);

  // Reset matrix when initial matrix changes
  useEffect(() => {
    setMatrix(deepCopy(initialMatrix));
    setIndex(-1);
    setPlaying(false);
  }, [initialMatrix]);

  // Play loop
  useEffect(() => {
    if (!playing) {
      clearTimeout(timerRef.current);
      return;
    }

    if (index >= actions.length - 1) {
      setPlaying(false);
      return;
    }

    timerRef.current = setTimeout(() => {
      stepForward();
    }, clamp(speed, 50, 5000));

    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, index, actions, speed]);

  // Actions
  function stepForward() {
    if (index + 1 >= actions.length) return;
    const next = actions[index + 1];
    setMatrix((prev) => applyActionToMatrix(prev, next));
    setIndex((i) => i + 1);
  }

  function stepBack() {
    if (index < 0) return;
    const act = actions[index];
    // swapping same indices again reverts
    setMatrix((prev) => applyActionToMatrix(prev, act));
    setIndex((i) => i - 1);
  }

  function handlePlayPause() {
    if (playing) setPlaying(false);
    else {
      if (index >= actions.length - 1) {
        // restart
        setMatrix(deepCopy(initialMatrix));
        setIndex(-1);
      }
      setPlaying(true);
    }
  }

  function handleReset() {
    setPlaying(false);
    setMatrix(deepCopy(initialMatrix));
    setIndex(-1);
  }

  function handleRandomize() {
    const flat = generateSequentialMatrix(n).flat();
    const shuffled = shuffleArray(flat);
    const mat = [];
    for (let i = 0; i < n; i++) mat.push(shuffled.slice(i * n, i * n + n));
    setInitialMatrix(mat);
  }

  function handleGenerateSequential() {
    const mat = generateSequentialMatrix(n);
    setInitialMatrix(mat);
  }

  function handleApplyCustom() {
    // parse inputText lines -> numbers
    const rows = inputText
      .trim()
      .split(/\n+/)
      .map((r) => r.trim())
      .filter(Boolean)
      .map((r) => r.split(/[,\s]+/).map((x) => Number(x)));

    if (rows.length === 0) return;
    const rowsCount = rows.length;
    if (!rows.every((r) => r.length === rowsCount)) {
      alert("Matrix must be square (same number of rows and columns).");
      return;
    }
    setN(rowsCount);
    setInitialMatrix(rows);
  }

  function handleSizeChange(newN) {
    const nn = clamp(Number(newN) || 2, 2, 10);
    setN(nn);
    setInitialMatrix(generateSequentialMatrix(nn));
  }

  // Highlight helpers
  const currentAction = index >= 0 ? actions[index] : null;
  function isCellHighlighted(i, j) {
    if (!currentAction) return false;
    if (currentAction.type === "swapRows") return i === currentAction.i1 || i === currentAction.i2;
    if (currentAction.type === "swapCells") {
      const [a1, b1] = currentAction.a;
      const [a2, b2] = currentAction.b;
      return (i === a1 && j === b1) || (i === a2 && j === b2);
    }
    return false;
  }

  function javaLineHighlighted(line) {
    if (!currentAction) return false;
    if (currentAction.type === "swapRows") {
      return (
        line.includes("matrix[i] = matrix[n - 1 - i]") ||
        line.includes("matrix[n - 1 - i] = temp") ||
        line.includes("int[] temp = matrix[i]")
      );
    }
    if (currentAction.type === "swapCells") {
      return (
        line.includes("int temp = matrix[i][j]") ||
        line.includes("matrix[i][j] = matrix[j][i]") ||
        line.includes("matrix[j][i] = temp")
      );
    }
    return false;
  }

  // UI Render
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 font-sans">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Matrix Rotator Visualizer (step-by-step)</h1>
        <div className="text-sm text-gray-600">Algorithm: reverse rows → transpose (mirrors your Java code)</div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Controls and Java code */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex items-center gap-2 mb-2">
              <label className="text-sm">Size (n × n):</label>
              <input
                type="number"
                min={2}
                max={10}
                value={n}
                onChange={(e) => handleSizeChange(e.target.value)}
                className="w-20 p-1 border rounded text-sm"
              />
              <button className="ml-2 px-2 py-1 border rounded text-sm" onClick={handleGenerateSequential}>
                Sequential
              </button>
              <button className="ml-2 px-2 py-1 border rounded text-sm" onClick={handleRandomize}>
                Randomize
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                className="px-3 py-1 border rounded"
                onClick={() => {
                  stepBack();
                  setPlaying(false);
                }}
                disabled={index < 0}
              >
                ◀ Step
              </button>

              <button
                className="px-3 py-1 border rounded"
                onClick={() => handlePlayPause()}
              >
                {playing ? "⏸ Pause" : "▶ Play"}
              </button>

              <button
                className="px-3 py-1 border rounded"
                onClick={() => {
                  stepForward();
                  setPlaying(false);
                }}
                disabled={index >= actions.length - 1}
              >
                Step ▶
              </button>

              <button className="px-3 py-1 border rounded ml-2" onClick={handleReset}>
                Reset
              </button>
            </div>

            <div className="mt-3 text-sm">
              <label>Speed (ms):</label>
              <input
                type="range"
                min={50}
                max={2000}
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-gray-600">{speed} ms per step</div>
            </div>

            <div className="mt-3">
              <label className="text-sm">Custom matrix (rows separated by newline, numbers by space or comma)</label>
              <textarea
                rows={4}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full mt-1 p-2 border rounded text-sm font-mono"
                placeholder={"1 2 3\n4 5 6\n7 8 9"}
              />
              <div className="flex gap-2 mt-2">
                <button className="px-2 py-1 border rounded" onClick={handleApplyCustom}>
                  Apply
                </button>
                <button
                  className="px-2 py-1 border rounded"
                  onClick={() => {
                    setInputText("1 2 3\n4 5 6\n7 8 9");
                  }}
                >
                  Example
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow max-h-96 overflow-auto">
            <h3 className="font-semibold mb-2">Java (algorithm)</h3>
            <pre className="text-sm font-mono whitespace-pre-wrap">
              {javaLines.map((ln, idx) => (
                <div
                  key={idx}
                  className={`px-2 rounded ${javaLineHighlighted(ln) ? "bg-yellow-100" : ""}`}
                >
                  <code>{ln}</code>
                </div>
              ))}
            </pre>
            <div className="text-xs text-gray-600 mt-2">
              The visualizer runs the same operations your Java code does: first reverse rows, then transpose.
            </div>
          </div>
        </div>

        {/* Middle: Matrix visualization */}
        <div className="lg:col-span-1 flex flex-col items-center">
          <div className="bg-white p-4 rounded-lg shadow w-full">
            <h3 className="font-semibold mb-3">Matrix</h3>

            <div
              className="mx-auto"
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${n}, minmax(44px, 64px))`,
                gap: 6,
              }}
            >
              {matrix.map((row, i) =>
                row.map((val, j) => {
                  const highlighted = isCellHighlighted(i, j);
                  return (
                    <div
                      key={`${i}-${j}`}
                      className={`flex items-center justify-center border rounded text-sm font-semibold h-12 w-12 select-none ${
                        highlighted ? "bg-yellow-100 border-yellow-400" : "bg-white"
                      }`}
                    >
                      {val}
                    </div>
                  );
                })
              )}
            </div>

            <div className="mt-4 text-sm text-gray-700">
              <div>Step: {Math.max(0, index + 1)} / {actions.length}</div>
              <div className="mt-1 font-medium text-gray-800">{currentAction ? currentAction.desc : "(not started)"}</div>
            </div>
          </div>
        </div>

        {/* Right: Details & timeline */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold">Timeline</h3>
            <div className="mt-3 max-h-64 overflow-auto text-sm font-mono">
              {actions.map((a, idx) => (
                <div
                  key={idx}
                  className={`p-2 rounded mb-1 cursor-pointer ${idx === index ? "bg-blue-50 border-l-4 border-blue-400" : "bg-white"}`}
                  onClick={() => {
                    // Jumping: reset and apply actions up to idx
                    setPlaying(false);
                    let m = deepCopy(initialMatrix);
                    for (let k = 0; k <= idx; k++) m = applyActionToMatrix(m, actions[k]);
                    setMatrix(m);
                    setIndex(idx);
                  }}
                >
                  <div className="text-xs text-gray-600">{idx + 1}</div>
                  <div className="text-sm">{a.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow text-sm">
            <h3 className="font-semibold mb-2">Tips</h3>
            <ul className="list-disc ml-5 text-gray-700">
              <li>Use <strong>Play</strong> to animate the whole algorithm.</li>
              <li>Use <strong>Step</strong> to advance one swap at a time (rows or cells).</li>
              <li>Click a timeline entry to jump to that step.</li>
              <li>Custom matrices must be square (same rows &amp; cols).</li>
            </ul>
          </div>
        </div>
      </div>

      <footer className="text-xs text-gray-500">Made for step-by-step learning — let me know if you want a downloadable HTML bundle or extra highlights.</footer>
    </div>
  );
}

window.MatrixRotatorVisualizer = MatrixRotatorVisualizer;