function generatePlatformsDescent(startY) {
    let y = startY;
    // Generate platforms downwards up to a bit beyond the bottom of the screen
    while (y < cameraY + canvas.height * 2) {
        let minWidth = Math.max(55, 80 - (currentLevel * 4));
        let maxWidth = Math.max(90, 160 - (currentLevel * 6));
        const width = minWidth + Math.random() * (maxWidth - minWidth);
        const x = Math.random() * (canvas.width - width);
        platforms.push(new Platform(x, y, width));
        
        // Gaps get larger as you level up (descend deeper)
        const gap = Math.min(180, 70 + Math.random() * 60 + (currentLevel * 10));
        y += gap;
    }
}

function generatePlatforms(startY) {
    let y = startY;
    // Generate platforms up to a bit beyond the current top of the screen
    while (y > cameraY - canvas.height) {
        // Platforms start wider (80-160) and gradually get smaller as levels increase (min 55-90)
        let minWidth = Math.max(55, 80 - (currentLevel * 4));
        let maxWidth = Math.max(90, 160 - (currentLevel * 6));
        const width = minWidth + Math.random() * (maxWidth - minWidth);
        const x = Math.random() * (canvas.width - width);
        platforms.push(new Platform(x, y, width));
        
        // As you get higher, platforms get slightly further apart
        const gap = Math.min(180, 70 + Math.random() * 60 + (currentLevel * 10));
        y -= gap;
    }
}