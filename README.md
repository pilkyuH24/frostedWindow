Challenges and Solutions in This Project
Initial Approach with Glassmorphism:
Initially, I aimed to create a realistic "frosted glass" effect with subtle fog and raindrops. However, achieving the transparency effect proved difficult, so I shifted towards a masking strategy. I plan to revisit and refine this approach with other libraries or technologies in the future if possible.

Fog Effect Implementation:
To simulate the foggy look, I used the imageData technique. This allowed me to extract and blur only the masked areas of the background, which I then re-merged into the scene using a custom array manipulation approach (instead of just merging). This helped create a smoother, more dynamic effect.

Raindrop Animation:
For the raindrop animation, I leveraged Tween and Tick to animate a circular shape with random variables. While I considered using WebGL or StageGL for better performance, I eventually decided against it due to time constraints and complexity.

Seamless Raindrop Effect:
To achieve a smooth and continuous raindrop flow without interruption, I used a method that tracks the cursor position during drawing, ensuring that new drops spawn seamlessly as the user interacts with the canvas.

Performance and Callback Challenges:
I faced significant challenges in managing screen updates and handling callback functions in real-time, especially when dealing with multiple animations and keeping them in sync. Performance was a key concern when trying to maintain smooth animations, but it was resolved by optimizing how updates were triggered and how the canvas was drawn.