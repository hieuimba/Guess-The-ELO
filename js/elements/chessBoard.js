import LichessPgnViewer from "../../node_modules/lichess-pgn-viewer/dist/lichess-pgn-viewer.min.js";
import { Chess } from "../../node_modules/chess.js/dist/esm/chess.js";

let evalDict;
let squaresDict;
let pieceAvantageDict;
let currentMoveGlobal;
let currentAnnotateTypeGlobal;
let orientationGlobal;
let evalEnabledGlobal;
const chess = new Chess();

export async function initializeChessBoard(moves, orientation, evalEnabled) {
  evalEnabledGlobal = evalEnabled;
  moves = cleanMoves(moves);
  const game = {
    pgn: moves,
    showPlayers: true,
    menu: {
      getPgn: {
        enabled: false,
      },
    },
    lichess: false,
    orientation: orientation,
    chessground: {
      disableContextMenu: true,
    },
  };

  LichessPgnViewer(document.querySelector("#boardContainer > div"), game);

  chess.loadPgn(moves);
  const history = chess.history({ verbose: true });

  evalDict = extractEval(history, moves);
  squaresDict = extractSquares(history);
  pieceAvantageDict = extractPieceAdvantage(history);
  currentMoveGlobal = undefined;
  currentAnnotateTypeGlobal = undefined;
  orientationGlobal = orientation;

  createEvalField();
  createEvalBar();
  addMovesObserver();
  addBoardSizeObserver();

  clearAnnotateIcon();
}
function cleanMoves(moves) {
  moves = moves.replace(/\([^)]*\)/g, "").replace(/\{[^{}]*best[^{}]*\}/g, "");
  if (!evalEnabledGlobal) {
    moves = moves.replace(/\[\%eval [^\]]+\]|\?|!/g, "");
  }
  return moves;
}

function addMovesObserver() {
  // Select all <move> elements within the .lpv__moves class
  const lpvMoves = document.querySelectorAll(".lpv__moves move");

  const observer = new MutationObserver(moveObserverCallback);
  const options = {
    attributes: true,
    attributeFilter: ["class"],
  };

  let moveIndex = 0;

  lpvMoves.forEach((move, index) => {
    if (!move.classList.contains("empty")) {
      move.setAttribute("id", "M" + (moveIndex + 1));
      moveIndex++;
    }
    observer.observe(move, options);
  });
}

function moveObserverCallback(mutations) {
  mutations.forEach((mutation) => {
    if (
      mutation.type === "attributes" &&
      mutation.target.classList.contains("current")
    ) {
      const currentEval = evalDict[mutation.target.id];
      updateEvalField(currentEval);
      updateEvalBar(currentEval);
      const currentSquare = squaresDict[mutation.target.id];
      currentMoveGlobal = currentSquare;
      if (mutation.target.classList.contains("inaccuracy")) {
        currentAnnotateTypeGlobal = "inaccuracy";
      } else if (mutation.target.classList.contains("mistake")) {
        currentAnnotateTypeGlobal = "mistake";
      } else if (mutation.target.classList.contains("blunder")) {
        currentAnnotateTypeGlobal = "blunder";
      } else {
        currentAnnotateTypeGlobal = undefined;
      }
      updateAnnotateIcon(currentAnnotateTypeGlobal, currentMoveGlobal);
      updatePieceAdvantage(pieceAvantageDict[mutation.target.id]);
    } else if (
      mutation.type === "attributes" &&
      mutation.target.id === "M1" &&
      mutation.target.classList.length === 0
    ) {
      if (evalEnabledGlobal) {
        updateEvalField(0);
        updateEvalBar(0);
      } else {
        updateEvalField(undefined);
        updateEvalBar(undefined);
      }

      clearAnnotateIcon();
    }
  });
}

function updatePieceAdvantage(advantageRecord) {
  const advantageFieldBot = document.querySelector(
    "#boardContainer > div > div.lpv__player.lpv__player--bottom > span > span"
  );
  const advantageFieldTop = document.querySelector(
    "#boardContainer > div > div.lpv__player.lpv__player--top  > span > span"
  );
  advantageFieldBot.style.display = "flex";
  advantageFieldTop.style.display = "flex";

  while (advantageFieldBot.firstChild) {
    advantageFieldBot.removeChild(advantageFieldBot.lastChild);
  }
  while (advantageFieldTop.firstChild) {
    advantageFieldTop.removeChild(advantageFieldTop.lastChild);
  }

  if (orientationGlobal == "white") {
    advantageFieldTop.appendChild(
      updateCapturedPieces(advantageRecord.blackCaptured)
    );
    advantageFieldTop.appendChild(
      updateCapturedvalue(advantageRecord.blackAdvantageValue)
    );

    advantageFieldBot.appendChild(
      updateCapturedPieces(advantageRecord.whiteCaptured)
    );
    advantageFieldBot.appendChild(
      updateCapturedvalue(advantageRecord.whiteAdvantageValue)
    );
  } else {
    advantageFieldTop.appendChild(
      updateCapturedPieces(advantageRecord.whiteCaptured)
    );
    advantageFieldTop.appendChild(
      updateCapturedvalue(advantageRecord.whiteAdvantageValue)
    );

    advantageFieldBot.appendChild(
      updateCapturedPieces(advantageRecord.blackCaptured)
    );
    advantageFieldBot.appendChild(
      updateCapturedvalue(advantageRecord.blackAdvantageValue)
    );
  }
}

function updateCapturedvalue(value) {
  const capturedValue = document.createElement("div");
  if (value == 0) {
    capturedValue.textContent = "";
  } else {
    capturedValue.textContent = "+" + value;
  }

  capturedValue.classList.add("capturedValue");
  return capturedValue;
}

function updateCapturedPieces(capturedList) {
  const capturedPieces = document.createElement("div");
  const capturedPawns = document.createElement("div");
  const capturedKnights = document.createElement("div");
  const capturedBishops = document.createElement("div");
  const capturedRooks = document.createElement("div");
  const capturedQueens = document.createElement("div");
  capturedPawns.style.display = "flex";
  capturedKnights.style.display = "flex";
  capturedBishops.style.display = "flex";
  capturedRooks.style.display = "flex";
  capturedQueens.style.display = "flex";
  capturedList.forEach((captured) => {
    if (captured == "p") {
      const piece = document.createElement("img");
      piece.src = "images/mini-pieces/mini-pawn.svg";
      piece.classList.add("mini-pawn");
      capturedPawns.append(piece);
    } else if (captured == "b") {
      const piece = document.createElement("img");
      piece.src = "images/mini-pieces/mini-bishop.svg";
      piece.classList.add("mini-bishop");
      capturedBishops.append(piece);
    } else if (captured == "n") {
      const piece = document.createElement("img");
      piece.src = "images/mini-pieces/mini-knight.svg";
      piece.classList.add("mini-knight");
      capturedKnights.append(piece);
    } else if (captured == "r") {
      const piece = document.createElement("img");
      piece.src = "images/mini-pieces/mini-rook.svg";
      piece.classList.add("mini-rook");
      capturedRooks.append(piece);
    } else if (captured == "q") {
      const piece = document.createElement("img");
      piece.src = "images/mini-pieces/mini-queen.svg";
      piece.classList.add("mini-queen");
      capturedQueens.append(piece);
    }
  });

  capturedPieces.style.display = "flex";
  capturedPieces.style.flexWrap = "nowrap";
  capturedPieces.append(
    capturedPawns,
    capturedKnights,
    capturedBishops,
    capturedRooks,
    capturedQueens
  );

  return capturedPieces;
}

function extractPieceAdvantage(history) {
  const pieceAdvantageDict = {};
  const pieceValues = {
    p: 1,
    n: 3,
    b: 3,
    r: 5,
    q: 9,
  };
  const pieceSortOrder = {
    p: 1,
    n: 2,
    b: 3,
    r: 4,
    q: 5,
  };

  let whiteCaptured = "";
  let blackCaptured = "";
  let whiteAdvantageValue = 0;
  let blackAdvantageValue = 0;
  let whiteAdvantageValueAbs = 0;
  let blackAdvantageValueAbs = 0;

  history.forEach((item, index) => {
    if (item.color == "w") {
      if (item.captured) {
        whiteCaptured += item.captured;
        whiteAdvantageValue += pieceValues[item.captured];
      } else if (item.promotion) {
        blackCaptured += "p";
        whiteAdvantageValue += pieceValues[item.promotion] - 1;
      }
    }
    if (item.color == "b") {
      if (item.captured) {
        blackCaptured += item.captured;
        blackAdvantageValue += pieceValues[item.captured];
      } else if (item.promotion) {
        whiteCaptured += "p";
        blackAdvantageValue += pieceValues[item.promotion] - 1;
      }
    }

    whiteAdvantageValueAbs =
      whiteAdvantageValue > blackAdvantageValue
        ? whiteAdvantageValue - blackAdvantageValue
        : 0;
    blackAdvantageValueAbs =
      blackAdvantageValue > whiteAdvantageValue
        ? blackAdvantageValue - whiteAdvantageValue
        : 0;

    const whiteCapturedSorted = whiteCaptured.split("").sort((a, b) => {
      return pieceSortOrder[a] - pieceSortOrder[b];
    });
    const blackCapturedSorted = blackCaptured.split("").sort((a, b) => {
      return pieceSortOrder[a] - pieceSortOrder[b];
    });

    pieceAdvantageDict[`M${index + 1}`] = {
      color: item.color === "w" ? "white" : "black",
      whiteCaptured: whiteCapturedSorted,
      blackCaptured: blackCapturedSorted,
      whiteAdvantageValue: whiteAdvantageValueAbs,
      blackAdvantageValue: blackAdvantageValueAbs,
    };
  });
  return pieceAdvantageDict;
}

function extractEval(history, moves) {
  const regex = /\[%\s*eval\s*([^%\]]+)\]/g;
  const matches = moves.matchAll(regex);

  // Convert iterator to an array
  const evalValues = Array.from(matches, (match) => match[1]);

  const evalDict = {};

  history.forEach((item, index) => {
    evalDict[`M${index + 1}`] = evalValues[index];
  });

  return evalDict;
}

function createEvalField() {
  const lpv = document.querySelector(".lpv");

  lpv.style.setProperty(
    "grid-template-areas",
    '"player-top eval-field" "board side" "player-bot side" "controls side"'
  );

  const evalField = document.createElement("div");
  evalField.style.gridArea = "eval-field";
  evalField.textContent = evalEnabledGlobal ? "Eval: 0.00" : "";

  evalField.id = "evalField";
  lpv.appendChild(evalField);
}

function createEvalBar() {
  const lpvBoard = document.querySelector(".lpv__board");

  lpvBoard.style.display = "grid";
  lpvBoard.style.setProperty("grid-template-areas", '"board-inner eval"');

  lpvBoard.style.setProperty("grid-template-columns", "98% 1%");

  // Create a new div element
  const evalBar = document.createElement("progress");
  evalBar.max = 100;
  evalBar.value = evalEnabledGlobal ? 50 : 0;
  // evalBar.style
  evalBar.style.zIndex = "50";
  evalBar.style.margin = "0";
  evalBar.style.transformOrigin = "left top";
  evalBar.style.transform = "rotate(-90deg) translate(-100%, 0)";
  evalBar.style.width = "var(--cg-height)";
  // Set the id attribute
  evalBar.id = "evalBar";
  if (orientationGlobal === "white") {
    evalBar.classList.add("white");
  } else {
    evalBar.classList.add("black");
  }

  // Append the evalBar div to the parent element
  lpvBoard.appendChild(evalBar);
}

function calcCoordinates(boardSize, square) {
  const xCoors = {
    a: 0,
    b: 1,
    c: 2,
    d: 3,
    e: 4,
    f: 5,
    g: 6,
    h: 7,
  };
  const yCoors = {
    1: 7,
    2: 6,
    3: 5,
    4: 4,
    5: 3,
    6: 2,
    7: 1,
    8: 0,
  };

  let xCoorsIndex;
  let yCoorsIndex;
  const xCoorsOffset = ((boardSize / 8) * 60) / 100;
  const yCoorsOffset = ((boardSize / 8) * 20) / 100;

  if (orientationGlobal === "white") {
    xCoorsIndex = xCoors[square.charAt(0)];
    yCoorsIndex = yCoors[square.charAt(1)];
  } else {
    xCoorsIndex = 7 - xCoors[square.charAt(0)];
    yCoorsIndex = 7 - yCoors[square.charAt(1)];
  }
  const xCoorPixel = (boardSize / 8) * xCoorsIndex + xCoorsOffset;
  const yCoorPixel = (boardSize / 8) * yCoorsIndex - yCoorsOffset;
  return `(${xCoorPixel}px, ${yCoorPixel}px)`;
}

function extractSquares(history) {
  const squaresDict = {};

  history.forEach((item, index) => {
    squaresDict[`M${index + 1}`] = item.to;
  });

  return squaresDict;
}

function addBoardSizeObserver() {
  const cgContainer = document.querySelector("cg-container");

  const observer = new ResizeObserver(boardSizeObserverCallback);

  observer.observe(cgContainer);
}

function boardSizeObserverCallback(resizes) {
  if (currentMoveGlobal == undefined) {
    return;
  }
  resizes.forEach(() => {
    updateAnnotateIcon(currentAnnotateTypeGlobal, currentMoveGlobal);
  });
}

function clearAnnotateIcon() {
  const annotateIcon = document.querySelectorAll("#annotate-icon");

  annotateIcon.forEach((item) => {
    item.remove();
  });
}

function updateAnnotateIcon(annotateType, currentSquare) {
  clearAnnotateIcon();
  if (annotateType == undefined) {
    return;
  }
  const cgContainer = document.querySelector("cg-container");
  const annotateIcon = document.createElement("img");
  annotateIcon.src = "images/annotate-icons/" + annotateType + ".svg";
  annotateIcon.style.position = "absolute";
  annotateIcon.style.width = "8%";
  annotateIcon.style.height = "8%";
  annotateIcon.style.zIndex = "60";
  annotateIcon.classList.add("light-shadow");

  const coors = calcCoordinates(
    parseInt(cgContainer.style.width),
    currentSquare
  );

  annotateIcon.style.transform = "translate" + coors;

  annotateIcon.id = "annotate-icon";
  cgContainer.appendChild(annotateIcon);
}

function calcEvalBarPercentage(evalNumber) {
  // Convert evalNumber to string if it's not already
  evalNumber = evalNumber.toString();

  // Check if evalNumber starts with '#'
  if (evalNumber.startsWith("#-")) {
    return 0;
  } else if (evalNumber.startsWith("#")) {
    // Check if evalNumber starts with '-#'
    return 100;
  } else {
    // Convert evalNumber back to a number
    evalNumber = parseFloat(evalNumber);
  }

  const evalPercentage =
    19.5815 * Math.log(125.743 * Math.abs(evalNumber) + 128.826) - 45.4045;
  if (evalNumber >= 0 && evalNumber <= 10) {
    return evalPercentage;
  } else if (evalNumber > 10) {
    return calcEvalBarPercentage(10);
  } else if (evalNumber < 0 && evalNumber >= -10) {
    return 100 - evalPercentage;
  } else {
    return 100 - calcEvalBarPercentage(10);
  }
}

function updateEvalBar(evalNumber) {
  const evalBar = document.getElementById("evalBar");
  if (evalNumber == undefined) {
    evalBar.value = 0;
    evalBar.style.display = "none";
  } else {
    const evalPercentage = calcEvalBarPercentage(evalNumber);
    evalBar.style.display = "block";
    evalBar.value =
      orientationGlobal === "white" ? evalPercentage : 100 - evalPercentage;
  }
}

function updateEvalField(evalNumber) {
  const evalField = document.getElementById("evalField");
  if (evalNumber == undefined) {
    evalField.textContent = "";
  } else {
    evalField.textContent = "Eval: " + evalNumber;
  }
}

export function removeChessBoard() {
  document.querySelector("#boardContainer > div").innerHTML = "";
}
