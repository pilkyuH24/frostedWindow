// Function to initiate the rain effect
export function makeItRain() {
    // Select the front and back rain container elements
    const frontRow = document.querySelector('.rain.front-row');
    const backRow = document.querySelector('.rain.back-row');
    const startRow1 = document.querySelector('.rain.start-row1');
    const startRow2 = document.querySelector('.rain.start-row2');
    const startRow3 = document.querySelector('.rain.start-row3');

    // Clear any existing raindrops in the containers
    if (frontRow) frontRow.innerHTML = '';
    if (backRow) backRow.innerHTML = '';
    if (startRow1) startRow1.innerHTML = '';
    if (startRow2) startRow2.innerHTML = '';
    if (startRow3) startRow3.innerHTML = '';

    // Create raindrops for each row with different parameters
    createRainDrops(frontRow, 100, 0.8, 0, 5);
    createRainDrops(backRow, 90, 1, 8, 10);
    createRainDrops(backRow, 80, 1, 15, 15);
    createRainDrops(startRow1, 60, 1, 20, 25);
    createRainDrops(startRow2, 50, 1, 30, 30);
    createRainDrops(startRow3, 40, 1, 45, 35);
}

// Function to generate raindrop elements with initial offset adjustment
function createRainDrops(container, dropCount, speedFactor, offsetFactor, initialOffset) {
    let increment = initialOffset / 4; // Initialize position with offset
    const drops = []; // Array to hold created raindrop elements

    // Loop to create the specified number of raindrops
    while (increment < dropCount + initialOffset) {
        const randomDelay = Math.floor(Math.random() * 98) + 1;
        const randomOffset = Math.floor(Math.random() * 4) + 1;
        increment += randomOffset;

        // Create the raindrop element
        const drop = document.createElement('div');
        drop.classList.add('drop');
        drop.style.left = `${increment}%`;
        drop.style.bottom = `${(randomOffset * 2 - 1) + 100 + offsetFactor}%`;
        drop.style.animationDelay = `0.${randomDelay}s`;
        drop.style.animationDuration = `${speedFactor + (randomDelay * 0.01)}s`;

        const stem = document.createElement('div');
        stem.classList.add('stem');
        stem.style.animationDelay = `0.${randomDelay}s`;
        stem.style.animationDuration = `${speedFactor + (randomDelay * 0.01)}s`;

        const splat = document.createElement('div');
        splat.classList.add('splat');
        splat.style.animationDelay = `0.${randomDelay}s`;
        splat.style.animationDuration = `${speedFactor + (randomDelay * 0.01)}s`;

        drop.appendChild(stem);
        drop.appendChild(splat);
        drops.push(drop);
    }

    drops.forEach(drop => container.appendChild(drop));
}
