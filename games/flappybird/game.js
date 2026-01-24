// Flappy Bird Game - Complete Implementation
class FlappyBirdGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameState = 'start'; // start, playing, paused, gameOver
        
        // Game settings - Easier and more balanced physics
        this.gravity = 0.25;
        this.jumpPower = -5;
        this.pipeSpeed = 1.2;
        this.pipeGap = 200;
        this.pipeWidth = 45;
        this.birdSize = 25;
        this.maxVelocity = 7;
        this.minVelocity = -7;
        
        // Game objects
        this.bird = {
            x: 100,
            y: this.canvas.height / 2,
            velocity: 0,
            size: this.birdSize,
            rotation: 0
        };
        
        this.pipes = [];
        this.score = 0;
        this.bestScore = parseInt(localStorage.getItem('flappyBirdBestScore')) || 0;
        this.gameSpeed = 1;
        this.difficultyLevel = 1;
        this.particles = [];
        this.screenShake = 0;
        
        // UI Animation tracking
        this.lastScore = 0;
        this.lastDifficultyLevel = 1;
        this.scoreAnimationTimeout = null;
        this.levelAnimationTimeout = null;
        
        // Animation
        this.animationId = null;
        this.lastTime = 0;
        
        // Sound effects (using actual audio files)
        this.sounds = {
            jump: null,
            // 9 different pipe crossing sounds
            pipeCross1: null,
            pipeCross2: null,
            pipeCross3: null,
            pipeCross4: null,
            pipeCross5: null,
            pipeCross6: null,
            pipeCross7: null,
            pipeCross8: null,
            pipeCross9: null,
            pipeCross10: null,
            pipeCross11: null,
            pipeCross12: null,
            // Death/out sound
            death: null
        };
        
        // Audio file paths
        this.audioFiles = {
            pipeCross1: 'sounds/soundeffect1.mp3',
            pipeCross2: 'sounds/soundeffect2.mp3',
            pipeCross3: 'sounds/soundeffect3.mp3',
            pipeCross4: 'sounds/soundeffect4.mp3',
            pipeCross5: 'sounds/soundeffect5.mp3',
            pipeCross6: 'sounds/soundeffect6.mp3',
            pipeCross7: 'sounds/soundeffect7.mp3',
            pipeCross8: 'sounds/soundeffect8.mp3',
            pipeCross9: 'sounds/soundeffect9.mp3',
            pipeCross10: 'sounds/soundeffect10.mp3',
            pipeCross11: 'sounds/soundeffect11.mp3',
            pipeCross12: 'sounds/soundeffect12.mp3',
            death: 'sounds/outsoundeffect.mp3'
        };
        
        this.init();
    }
    
    init() {
        this.setupCanvas();
        this.setupEventListeners();
        this.setupSounds();
        this.updateUI();
        this.gameLoop();
        
        // Debug: Check if touch area is properly set up
        const touchArea = document.getElementById('fullScreenTouch');
        if (touchArea) {
            console.log('Touch area found and ready!');
            console.log('Touch area dimensions:', touchArea.offsetWidth, 'x', touchArea.offsetHeight);
        } else {
            console.error('Touch area not found!');
        }
    }
    
    setupCanvas() {
        // Set canvas size to full screen
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        // Handle window resize
        window.addEventListener('resize', () => {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.bird.y = this.canvas.height / 2;
        });
    }
    
    setupEventListeners() {
        // Start button
        document.getElementById('startBtn').addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Start button clicked!');
            this.startGame();
        });
        
        // Start button touch events for mobile
        document.getElementById('startBtn').addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Start button touched!');
            this.startGame();
        }, { passive: false });
        
        // Restart button
        document.getElementById('restartBtn').addEventListener('click', () => {
            this.restartGame();
        });
        
        // Restart from pause
        document.getElementById('restartFromPauseBtn').addEventListener('click', () => {
            this.restartGame();
        });
        
        // Resume button
        document.getElementById('resumeBtn').addEventListener('click', () => {
            this.resumeGame();
        });
        
        // Pause button
        document.getElementById('pauseBtn').addEventListener('click', () => {
            this.pauseGame();
        });
        
        // Full screen touch area - Multiple event types for maximum compatibility
        const fullScreenTouch = document.getElementById('fullScreenTouch');
        
        // Click event for desktop
        fullScreenTouch.addEventListener('click', (e) => {
            // Only check for specific UI elements, not the entire gameUI
            if (e.target.closest('.gameBtn') || e.target.closest('.pauseBtn')) {
                return;
            }
            e.preventDefault();
            e.stopPropagation();
            console.log('Full screen touch area clicked!');
            this.jump();
        });
        
        // Touch events for mobile
        fullScreenTouch.addEventListener('touchstart', (e) => {
            // Only check for specific UI elements, not the entire gameUI
            if (e.target.closest('.gameBtn') || e.target.closest('.pauseBtn')) {
                return;
            }
            e.preventDefault();
            e.stopPropagation();
            console.log('Full screen touch area touched!');
            this.jump();
        }, { passive: false });
        
        fullScreenTouch.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, { passive: false });
        
        // Additional touch events for better mobile support
        fullScreenTouch.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });
        
        // Mouse events as backup
        fullScreenTouch.addEventListener('mousedown', (e) => {
            // Only check for specific UI elements, not the entire gameUI
            if (e.target.closest('.gameBtn') || e.target.closest('.pauseBtn')) {
                return;
            }
            e.preventDefault();
            e.stopPropagation();
            this.jump();
        });
        
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') {
                e.preventDefault();
                this.jump();
            } else if (e.code === 'Escape') {
                if (this.gameState === 'playing') {
                    this.pauseGame();
                } else if (this.gameState === 'paused') {
                    this.resumeGame();
                }
            }
        });
        
        // Document body touch events as ultimate backup
        document.body.addEventListener('touchstart', (e) => {
            // Only trigger if not on UI elements and game is playing
            if (this.gameState === 'playing' && !e.target.closest('.gameBtn') && !e.target.closest('.pauseBtn')) {
                e.preventDefault();
                e.stopPropagation();
                this.jump();
            }
        }, { passive: false });
        
        // Canvas touch controls (backup) - Always work during gameplay
        this.canvas.addEventListener('touchstart', (e) => {
            if (this.gameState === 'playing' || this.gameState === 'start') {
                e.preventDefault();
                e.stopPropagation();
                this.jump();
            }
        }, { passive: false });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, { passive: false });
        
        // Canvas mouse controls (backup)
        this.canvas.addEventListener('mousedown', (e) => {
            if (this.gameState === 'playing' || this.gameState === 'start') {
                e.preventDefault();
                this.jump();
            }
        });
        
        // Prevent context menu and other default behaviors
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
        
        // Prevent context menu on long press
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }
    
    setupSounds() {
        // Load actual audio files
        this.loadAudioFiles();
    }
    
    loadAudioFiles() {
        // Load all audio files
        Object.keys(this.audioFiles).forEach(soundKey => {
            const audio = new Audio();
            audio.src = this.audioFiles[soundKey];
            audio.preload = 'auto';
            audio.volume = 0.7; // Set volume to 70%
            
            // Handle loading errors
            audio.addEventListener('error', (e) => {
                console.warn(`Failed to load audio file: ${this.audioFiles[soundKey]}`, e);
            });
            
            this.sounds[soundKey] = audio;
        });
        
        console.log('Audio files loaded successfully!');
    }
    
    playSound(type) {
        // Play actual audio files
        if (type === 'score') {
            // Play random pipe crossing sound
            this.playRandomPipeSound();
            return;
        }
        
        if (type === 'jump') {
            // Keep the original jump sound using Web Audio API
            this.playJumpSound();
            return;
        }
        
        // Play the specified audio file
        const audio = this.sounds[type];
        if (audio) {
            // Reset audio to beginning and play
            audio.currentTime = 0;
            audio.play().catch(e => {
                console.warn(`Failed to play audio: ${type}`, e);
            });
        } else {
            console.warn(`Audio file not found: ${type}`);
        }
    }
    
    playJumpSound() {
        // Keep the original jump sound using Web Audio API
        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.setValueAtTime(300, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.1);
        } catch (e) {
            console.warn('Failed to play jump sound:', e);
        }
    }
    
    playRandomPipeSound() {
        // Play a random pipe crossing sound
        const pipeSounds = ['pipeCross1', 'pipeCross2', 'pipeCross3', 'pipeCross4', 'pipeCross5', 
                           'pipeCross6', 'pipeCross7', 'pipeCross8', 'pipeCross9'];
        const randomSound = pipeSounds[Math.floor(Math.random() * pipeSounds.length)];
        this.playSound(randomSound);
    }
    
    startGame() {
        this.gameState = 'playing';
        this.score = 0;
        this.difficultyLevel = 1;
        this.lastScore = 0;
        this.lastDifficultyLevel = 1;
        this.bird.y = this.canvas.height / 2;
        this.bird.velocity = 0;
        this.bird.rotation = 0;
        this.pipes = [];
        this.particles = [];
        this.gameSpeed = 1;
        this.screenShake = 0;
        this.updateUI();
        this.playSound('jump');
    }
    
    restartGame() {
        this.startGame();
    }
    
    pauseGame() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            this.updateUI();
        }
    }
    
    resumeGame() {
        if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.updateUI();
        }
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('flappyBirdBestScore', this.bestScore.toString());
        }
        this.updateUI();
        this.playSound('death'); // Play death sound instead of hit sound
    }
    
    jump() {
        console.log('Jump triggered! Game state:', this.gameState); // Debug log
        
        if (this.gameState === 'playing') {
            // More controlled jump with velocity limiting
            this.bird.velocity = Math.max(this.jumpPower, this.bird.velocity + this.jumpPower);
            this.bird.rotation = -0.2;
            this.playSound('jump');
            
            // Add jump particles
            this.addJumpParticles();
            
            // Visual feedback for jump
            this.showJumpFeedback();
        } else if (this.gameState === 'start') {
            this.startGame();
        }
    }
    
    showJumpFeedback() {
        // Visual feedback for jump - could add screen flash or other effects
        this.screenShake = 1;
    }
    
    addJumpParticles() {
        for (let i = 0; i < 5; i++) {
            this.particles.push({
                x: this.bird.x,
                y: this.bird.y,
                vx: (Math.random() - 0.5) * 4,
                vy: Math.random() * 3 + 1,
                life: 30,
                maxLife: 30,
                color: `hsl(${Math.random() * 60 + 30}, 100%, 60%)`
            });
        }
    }
    
    update(deltaTime) {
        if (this.gameState !== 'playing') return;
        
        // Update bird physics with velocity limiting
        this.bird.velocity += this.gravity;
        this.bird.velocity = Math.max(this.minVelocity, Math.min(this.maxVelocity, this.bird.velocity));
        this.bird.y += this.bird.velocity;
        this.bird.rotation = Math.min(Math.max(this.bird.velocity * 0.03, -0.4), 0.4);
        
        // Update particles
        this.updateParticles();
        
        // Update screen shake
        if (this.screenShake > 0) {
            this.screenShake *= 0.9;
            if (this.screenShake < 0.1) this.screenShake = 0;
        }
        
        // Check bird boundaries
        if (this.bird.y < 0 || this.bird.y > this.canvas.height - 50) {
            this.gameOver();
            return;
        }
        
        // Generate pipes
        if (this.pipes.length === 0 || this.pipes[this.pipes.length - 1].x < this.canvas.width - 200) {
            this.generatePipe();
        }
        
        // Update pipes
        for (let i = this.pipes.length - 1; i >= 0; i--) {
            const pipe = this.pipes[i];
            pipe.x -= this.pipeSpeed * this.gameSpeed;
            
            // Remove pipes that are off screen
            if (pipe.x + this.pipeWidth < 0) {
                this.pipes.splice(i, 1);
                continue;
            }
            
            // Check collision
            if (this.checkCollision(this.bird, pipe)) {
                this.gameOver();
                return;
            }
            
            // Check scoring
            if (!pipe.scored && pipe.x + this.pipeWidth < this.bird.x) {
                pipe.scored = true;
                this.score++;
                this.updateDifficulty();
                this.playSound('score');
                this.addScoreParticles();
                this.animateScoreUpdate();
                this.updateUI(); // Ensure UI is updated immediately
            }
        }
    }
    
    updateDifficulty() {
        // Progressive difficulty system - Much easier progression
        const newDifficultyLevel = Math.floor(this.score / 8) + 1;
        
        // Check if level increased
        if (newDifficultyLevel > this.difficultyLevel) {
            this.difficultyLevel = newDifficultyLevel;
            this.animateLevelUp();
        }
        
        // Gradually increase difficulty - Slower progression
        this.pipeSpeed = Math.min(1.2 + (this.difficultyLevel - 1) * 0.2, 3);
        this.pipeGap = Math.max(200 - (this.difficultyLevel - 1) * 8, 160);
        this.gravity = Math.min(0.25 + (this.difficultyLevel - 1) * 0.03, 0.45);
        
        // Add screen shake for score milestones
        if (this.score % 15 === 0) {
            this.screenShake = 3;
        }
    }
    
    addScoreParticles() {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: this.bird.x,
                y: this.bird.y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 40,
                maxLife: 40,
                color: `hsl(${Math.random() * 60 + 120}, 100%, 60%)`
            });
        }
    }
    
    animateScoreUpdate() {
        const scoreElement = document.querySelector('.score');
        if (!scoreElement) return;
        
        // Clear any existing timeouts
        if (this.scoreAnimationTimeout) {
            clearTimeout(this.scoreAnimationTimeout);
        }
        
        // Add celebration class for milestones
        if (this.score % 10 === 0 && this.score > 0) {
            scoreElement.classList.add('score-milestone');
            this.scoreAnimationTimeout = setTimeout(() => {
                scoreElement.classList.remove('score-milestone');
            }, 1000);
        } else {
            // Regular score update animation
            scoreElement.classList.add('score-celebration');
            this.scoreAnimationTimeout = setTimeout(() => {
                scoreElement.classList.remove('score-celebration');
            }, 600);
        }
        
        // Add shimmer effect
        scoreElement.classList.add('score-updated');
        setTimeout(() => {
            scoreElement.classList.remove('score-updated');
        }, 500);
    }
    
    animateLevelUp() {
        // Level up animation removed since level display is no longer shown
        // But we still keep the function to avoid errors
    }
    
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.1; // gravity
            particle.life--;
            
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    generatePipe() {
        const minHeight = 60;
        const maxHeight = this.canvas.height - this.pipeGap - 60;
        const topHeight = Math.random() * (maxHeight - minHeight) + minHeight;
        
        this.pipes.push({
            x: this.canvas.width,
            topHeight: topHeight,
            bottomY: topHeight + this.pipeGap,
            scored: false
        });
    }
    
    checkCollision(bird, pipe) {
        const birdLeft = bird.x - bird.size / 2;
        const birdRight = bird.x + bird.size / 2;
        const birdTop = bird.y - bird.size / 2;
        const birdBottom = bird.y + bird.size / 2;
        
        const pipeLeft = pipe.x;
        const pipeRight = pipe.x + this.pipeWidth;
        
        // Check if bird is in pipe's x range
        if (birdRight > pipeLeft && birdLeft < pipeRight) {
            // Check if bird hits top or bottom pipe
            if (birdTop < pipe.topHeight || birdBottom > pipe.bottomY) {
                return true;
            }
        }
        
        return false;
    }
    
    render() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Apply screen shake
        this.ctx.save();
        if (this.screenShake > 0) {
            const shakeX = (Math.random() - 0.5) * this.screenShake;
            const shakeY = (Math.random() - 0.5) * this.screenShake;
            this.ctx.translate(shakeX, shakeY);
        }
        
        // Draw background
        this.drawBackground();
        
        // Draw pipes
        this.drawPipes();
        
        // Draw bird
        this.drawBird();
        
        // Draw ground
        this.drawGround();
        
        // Draw particles
        this.drawParticles();
        
        this.ctx.restore();
    }
    
    drawBackground() {
        // Dynamic sky gradient that changes over time
        const time = Date.now() * 0.0005;
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        
        // Color shifts based on time for dynamic effect
        const skyBlue = `hsl(${200 + Math.sin(time) * 10}, 70%, 80%)`;
        const lightGreen = `hsl(${120 + Math.sin(time * 0.7) * 15}, 60%, 85%)`;
        const groundGreen = `hsl(${100 + Math.sin(time * 0.5) * 20}, 70%, 75%)`;
        
        gradient.addColorStop(0, skyBlue);
        gradient.addColorStop(0.6, lightGreen);
        gradient.addColorStop(1, groundGreen);
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Animated clouds with different sizes and speeds
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        for (let i = 0; i < 5; i++) {
            const speed = 0.0003 + (i * 0.0001);
            const x = ((Date.now() * speed) + (i * 200)) % (this.canvas.width + 100) - 50;
            const y = 30 + (i * 40) + Math.sin(Date.now() * 0.001 + i) * 15;
            this.drawCloud(x, y, 0.8 + (i * 0.1));
        }
        
        // Floating particles for magical effect
        this.drawFloatingParticles();
        
        // Sun with glow effect
        this.drawSun();
    }
    
    drawCloud(x, y, scale = 1) {
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.scale(scale, scale);
        
        // Cloud shadow
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.beginPath();
        this.ctx.arc(2, 2, 20, 0, Math.PI * 2);
        this.ctx.arc(27, 2, 25, 0, Math.PI * 2);
        this.ctx.arc(52, 2, 20, 0, Math.PI * 2);
        this.ctx.arc(27, -13, 20, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Main cloud
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 20, 0, Math.PI * 2);
        this.ctx.arc(25, 0, 25, 0, Math.PI * 2);
        this.ctx.arc(50, 0, 20, 0, Math.PI * 2);
        this.ctx.arc(25, -15, 20, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    drawFloatingParticles() {
        const time = Date.now() * 0.002;
        for (let i = 0; i < 8; i++) {
            const x = (Math.sin(time + i) * this.canvas.width * 0.3) + this.canvas.width * 0.5;
            const y = (Math.cos(time * 0.7 + i) * 50) + 100 + (i * 30);
            const size = 2 + Math.sin(time + i) * 1;
            const alpha = 0.3 + Math.sin(time + i) * 0.2;
            
            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = `hsl(${180 + Math.sin(time + i) * 30}, 100%, 90%)`;
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }
    }
    
    drawSun() {
        const time = Date.now() * 0.001;
        const sunX = this.canvas.width - 80;
        const sunY = 60;
        const sunSize = 25 + Math.sin(time) * 3;
        
        // Sun glow
        const glowGradient = this.ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunSize + 15);
        glowGradient.addColorStop(0, 'rgba(255, 255, 0, 0.8)');
        glowGradient.addColorStop(0.7, 'rgba(255, 200, 0, 0.4)');
        glowGradient.addColorStop(1, 'rgba(255, 200, 0, 0)');
        
        this.ctx.fillStyle = glowGradient;
        this.ctx.beginPath();
        this.ctx.arc(sunX, sunY, sunSize + 15, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Sun body
        this.ctx.fillStyle = '#FFD700';
        this.ctx.beginPath();
        this.ctx.arc(sunX, sunY, sunSize, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Sun highlight
        this.ctx.fillStyle = '#FFF';
        this.ctx.beginPath();
        this.ctx.arc(sunX - 5, sunY - 5, sunSize * 0.3, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawPipes() {
        this.pipes.forEach(pipe => {
            // Top pipe with gradient
            const topGradient = this.ctx.createLinearGradient(pipe.x, 0, pipe.x + this.pipeWidth, 0);
            topGradient.addColorStop(0, '#32CD32');
            topGradient.addColorStop(0.5, '#228B22');
            topGradient.addColorStop(1, '#006400');
            this.ctx.fillStyle = topGradient;
            this.ctx.fillRect(pipe.x, 0, this.pipeWidth, pipe.topHeight);
            
            // Top pipe outline
            this.ctx.strokeStyle = '#004400';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(pipe.x, 0, this.pipeWidth, pipe.topHeight);
            
            // Bottom pipe with gradient
            const bottomGradient = this.ctx.createLinearGradient(pipe.x, pipe.bottomY, pipe.x + this.pipeWidth, pipe.bottomY);
            bottomGradient.addColorStop(0, '#32CD32');
            bottomGradient.addColorStop(0.5, '#228B22');
            bottomGradient.addColorStop(1, '#006400');
            this.ctx.fillStyle = bottomGradient;
            this.ctx.fillRect(pipe.x, pipe.bottomY, this.pipeWidth, this.canvas.height - pipe.bottomY);
            
            // Bottom pipe outline
            this.ctx.strokeStyle = '#004400';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(pipe.x, pipe.bottomY, this.pipeWidth, this.canvas.height - pipe.bottomY);
            
            // Enhanced pipe caps with 3D effect
            const capGradient = this.ctx.createLinearGradient(pipe.x - 5, 0, pipe.x + this.pipeWidth + 5, 0);
            capGradient.addColorStop(0, '#90EE90');
            capGradient.addColorStop(0.5, '#32CD32');
            capGradient.addColorStop(1, '#228B22');
            this.ctx.fillStyle = capGradient;
            this.ctx.fillRect(pipe.x - 5, pipe.topHeight - 25, this.pipeWidth + 10, 25);
            this.ctx.fillRect(pipe.x - 5, pipe.bottomY, this.pipeWidth + 10, 25);
            
            // Cap highlights
            this.ctx.fillStyle = '#B8FFB8';
            this.ctx.fillRect(pipe.x - 3, pipe.topHeight - 23, this.pipeWidth + 6, 3);
            this.ctx.fillRect(pipe.x - 3, pipe.bottomY + 2, this.pipeWidth + 6, 3);
            
            // Cap shadows
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            this.ctx.fillRect(pipe.x - 5, pipe.topHeight - 2, this.pipeWidth + 10, 2);
            this.ctx.fillRect(pipe.x - 5, pipe.bottomY + 23, this.pipeWidth + 10, 2);
        });
    }
    
    drawBird() {
        this.ctx.save();
        this.ctx.translate(this.bird.x, this.bird.y);
        this.ctx.rotate(this.bird.rotation);
        
        // Bird shadow with blur effect
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.beginPath();
        this.ctx.ellipse(3, 3, this.bird.size / 2, this.bird.size / 3, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Bird body with enhanced gradient
        const bodyGradient = this.ctx.createRadialGradient(-2, -2, 0, 0, 0, this.bird.size / 2);
        bodyGradient.addColorStop(0, '#FFE55C');
        bodyGradient.addColorStop(0.5, '#FFD700');
        bodyGradient.addColorStop(1, '#FF8C00');
        this.ctx.fillStyle = bodyGradient;
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, this.bird.size / 2, this.bird.size / 3, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Bird wing with enhanced animation and gradient
        const wingOffset = Math.sin(Date.now() * 0.015) * 3;
        const wingGradient = this.ctx.createLinearGradient(-8, -8, -2, -2);
        wingGradient.addColorStop(0, '#FF6B35');
        wingGradient.addColorStop(1, '#F7931E');
        this.ctx.fillStyle = wingGradient;
        this.ctx.beginPath();
        this.ctx.ellipse(-5, -5 + wingOffset, this.bird.size / 3, this.bird.size / 5, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Wing details
        this.ctx.strokeStyle = '#E55A2B';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.ellipse(-5, -5 + wingOffset, this.bird.size / 3, this.bird.size / 5, 0, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Bird eye with enhanced details
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(5, -3, 4, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Eye highlight with animation
        const eyeSparkle = Math.sin(Date.now() * 0.01) * 0.5 + 1;
        this.ctx.fillStyle = '#FFF';
        this.ctx.beginPath();
        this.ctx.arc(6, -4, eyeSparkle, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Additional eye sparkle
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.ctx.beginPath();
        this.ctx.arc(4, -5, 0.8, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Enhanced bird beak with gradient
        const beakGradient = this.ctx.createLinearGradient(this.bird.size / 2, -2, this.bird.size / 2 + 8, 0);
        beakGradient.addColorStop(0, '#FF6B35');
        beakGradient.addColorStop(1, '#FF4500');
        this.ctx.fillStyle = beakGradient;
        this.ctx.beginPath();
        this.ctx.moveTo(this.bird.size / 2, 0);
        this.ctx.lineTo(this.bird.size / 2 + 10, -3);
        this.ctx.lineTo(this.bird.size / 2 + 10, 3);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Beak highlight
        this.ctx.fillStyle = '#FF8C69';
        this.ctx.beginPath();
        this.ctx.moveTo(this.bird.size / 2 + 1, -1);
        this.ctx.lineTo(this.bird.size / 2 + 8, -2);
        this.ctx.lineTo(this.bird.size / 2 + 8, 0);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Bird tail feathers
        this.ctx.fillStyle = '#FF8C00';
        this.ctx.beginPath();
        this.ctx.moveTo(-this.bird.size / 2, 0);
        this.ctx.lineTo(-this.bird.size / 2 - 8, -3);
        this.ctx.lineTo(-this.bird.size / 2 - 6, 0);
        this.ctx.lineTo(-this.bird.size / 2 - 8, 3);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Enhanced bird outline
        this.ctx.strokeStyle = '#B8860B';
        this.ctx.lineWidth = 1.5;
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, this.bird.size / 2, this.bird.size / 3, 0, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // Add some sparkle effects around the bird
        this.drawBirdSparkles();
        
        this.ctx.restore();
    }
    
    drawBirdSparkles() {
        const time = Date.now() * 0.005;
        for (let i = 0; i < 3; i++) {
            const angle = time + (i * Math.PI * 2 / 3);
            const radius = 20 + Math.sin(time + i) * 5;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            const alpha = 0.3 + Math.sin(time + i) * 0.2;
            
            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = '#FFD700';
            this.ctx.beginPath();
            this.ctx.arc(x, y, 1.5, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }
    }
    
    drawGround() {
        const groundHeight = 50;
        const time = Date.now() * 0.001;
        
        // Ground with gradient
        const groundGradient = this.ctx.createLinearGradient(0, this.canvas.height - groundHeight, 0, this.canvas.height);
        groundGradient.addColorStop(0, '#8B4513');
        groundGradient.addColorStop(1, '#654321');
        this.ctx.fillStyle = groundGradient;
        this.ctx.fillRect(0, this.canvas.height - groundHeight, this.canvas.width, groundHeight);
        
        // Animated grass on top of ground
        this.ctx.fillStyle = '#228B22';
        this.ctx.fillRect(0, this.canvas.height - groundHeight - 15, this.canvas.width, 15);
        
        // Grass details with animation
        this.ctx.strokeStyle = '#32CD32';
        this.ctx.lineWidth = 2;
        for (let i = 0; i < this.canvas.width; i += 8) {
            const grassHeight = 5 + Math.sin(time + i * 0.1) * 3;
            this.ctx.beginPath();
            this.ctx.moveTo(i, this.canvas.height - groundHeight - 15);
            this.ctx.lineTo(i, this.canvas.height - groundHeight - 15 - grassHeight);
            this.ctx.stroke();
        }
        
        // Ground texture
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        for (let i = 0; i < this.canvas.width; i += 20) {
            const offset = Math.sin(time + i * 0.05) * 2;
            this.ctx.fillRect(i, this.canvas.height - groundHeight + offset, 15, 3);
        }
    }
    
    drawParticles() {
        // Draw particle effects
        this.particles.forEach(particle => {
            const alpha = particle.life / particle.maxLife;
            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        });
    }
    
    updateUI() {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        
        // Show appropriate screen
        switch (this.gameState) {
            case 'start':
                document.getElementById('startScreen').classList.add('active');
                break;
            case 'playing':
                document.getElementById('gameHUD').classList.add('active');
                break;
            case 'paused':
                document.getElementById('pauseScreen').classList.add('active');
                break;
            case 'gameOver':
                document.getElementById('gameOverScreen').classList.add('active');
                document.getElementById('finalScore').textContent = this.score;
                document.getElementById('bestScore').textContent = this.bestScore;
                break;
        }
        
        // Update score display
        document.getElementById('currentScore').textContent = this.score;
    }
    
    gameLoop(currentTime = 0) {
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        this.update(deltaTime);
        this.render();
        
        this.animationId = requestAnimationFrame((time) => this.gameLoop(time));
    }
} 

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Resume audio context on first user interaction
    const resumeAudio = () => {
        if (window.game && window.game.audioContext && window.game.audioContext.state === 'suspended') {
            window.game.audioContext.resume();
        }
        document.removeEventListener('click', resumeAudio);
        document.removeEventListener('touchstart', resumeAudio);
    };
    
    document.addEventListener('click', resumeAudio);
    document.addEventListener('touchstart', resumeAudio);
    
    // Start the game
    window.game = new FlappyBirdGame();
});

// Handle page visibility changes (pause when tab is not active)
document.addEventListener('visibilitychange', () => {
    if (window.game) { 
        if (document.hidden && window.game.gameState === 'playing') {
            window.game.pauseGame();
        }
    }
});

// Prevent zoom on double tap (mobile)
let lastTouchEnd = 0;
document.addEventListener('touchend', (event) => {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, false);

// Add touch feedback for better mobile experience
document.addEventListener('touchstart', (e) => {
    // Add haptic feedback if available
    if (navigator.vibrate) {
        navigator.vibrate(10);
    }
}, { passive: true });

// Improve touch responsiveness
document.addEventListener('DOMContentLoaded', () => {
    // Add touch-action CSS to prevent default touch behaviors
    document.body.style.touchAction = 'manipulation';
    
    // Prevent pull-to-refresh on mobile
    document.addEventListener('touchmove', (e) => {
        if (e.touches.length > 1) {
            e.preventDefault();
        }
    }, { passive: false });
    
    // Prevent context menu on long press
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });
});
