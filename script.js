function calculate() {
    const inputNumber = document.getElementById("inputNumber").value;
    const number = parseFloat(inputNumber);

    if (isNaN(number) || !Number.isInteger(number) || number <= 0) {
        const result = document.getElementById("result");
        result.style.color = "red";
        result.textContent = isNaN(number)
            ? "The input is not a number !!"
            : "You must enter a natural number !!";
        return;
    }

    document.getElementById("result").textContent = "";
    addInputFields(number);
}

function addInputFields(count) {
    const container = document.querySelector(".container");
    container.innerHTML = "";

    const h2 = document.createElement("h2");
    h2.innerHTML = "Please enter details for the target volumes: <br>(Volume: V; Coordinate: x, y, z)";
    container.appendChild(h2);

    for (let i = 0; i < count; i++) {
        const inputContainer = document.createElement("div");
        inputContainer.classList.add("input-container");

        ["V", "x", "y", "z"].forEach(coord => {
            const input = document.createElement("input");
            input.type = "number";
            input.placeholder = `${coord}_PTV ${i + 1}`;
            inputContainer.appendChild(input);
        });

        container.appendChild(inputContainer);
    }

    const planButton = document.createElement("button");
    planButton.textContent = "Planning Treatment Volume";
    planButton.onclick = computeIsocenterAndVolume;
    container.appendChild(planButton);
}

function computeIsocenterAndVolume() {
    const container = document.querySelector(".container");
    const inputContainers = document.querySelectorAll(".input-container");

    let xValues = [], yValues = [], zValues = [];

    inputContainers.forEach(container => {
        const inputs = container.querySelectorAll("input[type='number']");
        const V = parseFloat(inputs[0].value);
        const x = parseFloat(inputs[1].value);
        const y = parseFloat(inputs[2].value);
        const z = parseFloat(inputs[3].value);

        if (!isNaN(x)) xValues.push(x);
        if (!isNaN(y)) yValues.push(y);
        if (!isNaN(z)) zValues.push(z);

        const radius = ((3 * V) / (4 * Math.PI)) ** (1 / 3);
        const result = document.createElement("div");
        result.textContent = `Radius = ${radius.toFixed(2)} cm, x = ${x} cm, y = ${y} cm, z = ${z} cm`;
        container.appendChild(result);
    });

    const xiso = (Math.max(...xValues) + Math.min(...xValues)) / 2;
    const yiso = (Math.max(...yValues) + Math.min(...yValues)) / 2;
    const ziso = (Math.max(...zValues) + Math.min(...zValues)) / 2;

    const isoDisplay = document.createElement("div");
    isoDisplay.classList.add("isocenter-display");
    isoDisplay.innerHTML = `ISOCENTER Coordinates:<br>x = ${xiso.toFixed(2)} cm<br>y = ${yiso.toFixed(2)} cm<br>z = ${ziso.toFixed(2)} cm`;
    container.appendChild(isoDisplay);

    const optimizeButton = document.createElement("button");
    optimizeButton.textContent = "Optimize Collimator Angle";
    optimizeButton.onclick = () => optimizeCollimator(inputContainers);
    container.appendChild(optimizeButton);
}

function optimizeCollimator(inputContainers) {
    const container = document.querySelector(".container");

    function rotationMatrix(axis, angle) {
        const rad = angle * Math.PI / 180;
        if (axis === 'x') {
            return [
                [1, 0, 0],
                [0, Math.cos(rad), -Math.sin(rad)],
                [0, Math.sin(rad), Math.cos(rad)]
            ];
        } else if (axis === 'y') {
            return [
                [Math.cos(rad), 0, Math.sin(rad)],
                [0, 1, 0],
                [-Math.sin(rad), 0, Math.cos(rad)]
            ];
        } else if (axis === 'z') {
            return [
                [Math.cos(rad), -Math.sin(rad), 0],
                [Math.sin(rad), Math.cos(rad), 0],
                [0, 0, 1]
            ];
        }
    }

    function computeAngle(t) {
        let maxScore = -Infinity;
        let bestAngle = 0;

        for (let c = 0; c <= 180; c++) {
            let score = 0;

            for (let g = 0; g <= 360; g++) {
                inputContainers.forEach(container => {
                    const inputs = container.querySelectorAll("input[type='number']");
                    const V = parseFloat(inputs[0].value);
                    const x = parseFloat(inputs[1].value);
                    const y = parseFloat(inputs[2].value);
                    const z = parseFloat(inputs[3].value);

                    const radius = ((3 * V) / (4 * Math.PI)) ** (1 / 3);
                    const coord = [x, y, z];

                    let R = math.multiply(
                        rotationMatrix('z', g),
                        rotationMatrix('x', c)
                    );
                    R = math.multiply(R, rotationMatrix('y', t));
                    const rotated = math.multiply(R, coord);

                    if (rotated[0] - radius < 0 && rotated[2] + radius > 0) score++;
                });
            }

            if (score > maxScore) {
                maxScore = score;
                bestAngle = c;
            }
        }
        return bestAngle;
    }

    const anglesToTest = [0, 335, 310, 285, 25, 50, 75];
    const output = document.createElement("div");
    output.classList.add("collimator-results");
    output.innerHTML = "<h3>Optimized Collimator Angles:</h3>";
    anglesToTest.forEach(t => {
        const angle = computeAngle(t);
        output.innerHTML += `Couch: ${t}°, Optimal Collimator Angle: ${angle}°<br>`;
    });
    container.appendChild(output);
}

// UI protection

document.addEventListener("DOMContentLoaded", () => {
    document.body.style.backgroundColor = "lightblue";
});

document.addEventListener("keydown", event => {
    if (event.ctrlKey || event.keyCode === 123) event.preventDefault();
});

document.addEventListener("contextmenu", event => event.preventDefault());
