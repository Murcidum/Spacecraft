new Vue({
  el: '#app',
  data: {
    shipImages: {
      normal: 'img/normal.png',
      thrusting: 'img/tr.png',
      expl: 'img/exp.png'
    },
    showSettings: false,
    settings: {
      spacecraftMass: { label: 'Масса корабля', unit: 'кг', min: 1000, step: 100 },
      fuelMass: { label: 'Запас топлива', unit: 'кг', min: 100, step: 50 },
      impulseWeight: { label: 'Расход топлива', unit: 'кг/с', min: 10, step: 10 },
      exhaustVelocity: { label: 'Скорость истечения', unit: 'м/с', min: 100, step: 100 },
      maxLandingSpeed: { label: 'Макс. скорость', unit: 'м/с', min: 1, step: 0.1 },
      gravity: { label: 'Гравитация', unit: 'м/с²', min: 1, step: 0.1 },
      timeLimit: { label: 'Лимит времени', unit: 'с', min: 10, step: 1 },
      initialDistance: { label: 'Высота', unit: 'м', min: 100, step: 10 }
    },
    tempParams: {
      spacecraftMass: 15000,
      fuelMass: 5000,
      impulseWeight: 100,
      exhaustVelocity: 2000,
      maxLandingSpeed: 5,
      gravity: 3.71,
      timeLimit: 60,
      initialDistance: 1000
    },


    isMobileView: false,
    spacecraftMass: 15000,
    fuelMass: 5000,
    impulseWeight: 100,
    exhaustVelocity: 2000,
    maxLandingSpeed: 5,
    gravity: 3.71,
    timeLimit: 60,
    initialDistance: 1000,

    gameStarted: false,
    gameEnded: false,
    gameBad: false,
    isPaused: false,
    currentSpeed: 0,
    currentTime: 0,
    currentDistance: 1000,
    currentFuel: 5000,
    isThrusting: {
      spaceKey: false,
      mouseButton: false
    },
    resultMessage: '',
    gameLoop: null,
    lastUpdate: 0
  },
  computed: {
    spacecraftStyle() {
      return {
        bottom: `${90 + (this.currentDistance / this.initialDistance * 500)}px`
      };
    },
    currentShipImage() {
      if(this.gameBad){
        return this.shipImages.expl;
      }
      return this.isThrusting.spaceKey || this.isThrusting.mouseButton
        ? this.shipImages.thrusting
        : this.shipImages.normal;
    },
  },
  methods: {

    checkViewport() {
      this.isMobileView = window.innerWidth < 960 || window.innerHeight < 600;
    },

    saveSettings() {
      let isValid = true;
      for(const key in this.tempParams) {
        if(this.tempParams[key] < this.settings[key].min) {
          isValid = false;
          alert(`Минимальное значение для ${this.settings[key].label}: ${this.settings[key].min}`);
          break;
        }
      }
      if(isValid) {
        this.showSettings = false;
      }
    },

    startGame() {
      this.gameBad = false;
      for(const key in this.tempParams) {
        this[key] = this.tempParams[key];
      }
      this.gameStarted = true;
      this.resetGame();
      this.startGameLoop();
    },

    resetGame() {
      this.currentSpeed = 0;
      this.currentTime = 0;
      this.currentDistance = this.initialDistance;
      this.currentFuel = this.fuelMass;
      this.gameEnded = false;
    },

    startGameLoop() {
      this.lastUpdate = performance.now();
      this.gameLoop = requestAnimationFrame(this.update);
    },

    update(timestamp) {
      if (this.isPaused || this.gameEnded) return;

      const deltaTime = (timestamp - this.lastUpdate) / 1000;
      this.lastUpdate = timestamp;

      this.currentTime += deltaTime;

      if (this.currentTime >= this.timeLimit) {
        this.endGame(false, 'Превышено время посадки!');
        return;
      }

      let acceleration = this.gravity;

      if ((this.isThrusting.spaceKey || this.isThrusting.mouseButton) && this.currentFuel > 0) {
        const mass = this.spacecraftMass + this.currentFuel;
        const thrustAcceleration = (this.impulseWeight * this.exhaustVelocity) / mass;
        acceleration -= thrustAcceleration;
        this.currentFuel = Math.max(0, this.currentFuel - this.impulseWeight * deltaTime);
      }

      this.currentSpeed += acceleration * deltaTime;
      this.currentDistance = Math.max(0, this.currentDistance - this.currentSpeed * deltaTime);

      if (this.currentDistance <= 0) {
        const landingSpeed = Math.abs(this.currentSpeed);
        if (landingSpeed <= this.maxLandingSpeed) {
          this.endGame(true, 'Идеальная посадка!');
        } else {
          this.endGame(false, `Скорость: ${landingSpeed.toFixed(2)} м/с`);
        }
        return;
      }

      this.gameLoop = requestAnimationFrame(this.update);
    },

    endGame(success, message) {
      this.gameEnded = true;
      this.resultMessage = success
        ? "Посадка успешна! 🎉"
        : `Крушение! ${message} 💥`;
      if (!success){
        this.gameBad = true;
      }

      cancelAnimationFrame(this.gameLoop);
    },

    togglePause() {
      this.isPaused = !this.isPaused;
      if (this.isPaused) {
        // Отмена текущего цикл анимации
        cancelAnimationFrame(this.gameLoop);
        this.gameLoop = null;
      } else if (!this.gameEnded) {
        // Перезапускаем цикл
        this.startGameLoop();
      }
    },

    startThrust() {
      this.isThrusting.mouseButton = true;
    },

    stopThrust() {
      this.isThrusting.mouseButton = false;
    },

    restartGame() {
      this.gameStarted = false;
    }
  },
  mounted() {
    this.checkViewport();
    window.addEventListener('resize', this.checkViewport);

    document.addEventListener('keydown', (e) => {
      console.log(e);
      if (e.key === 'p' || e.key === 'P' || e.keyCode == 112 || e.keyCode == 80) {
        this.togglePause();
      }

      if (e.code === 'Space') {
        e.preventDefault();
        this.isThrusting.spaceKey = true;
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        this.isThrusting.spaceKey = false;
      }
    });
  }
});
