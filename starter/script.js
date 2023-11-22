'use strict';

const del = document.querySelector('workout__title');

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
class workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);
  clicks = 0;
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }
  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
  click() {
    this.clicks++;
  }
}
class Running extends workout {
  type = 'running';

  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence;
    this.calcPace();
    this._setDescription();
  }
  calcPace() {
    //min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
class Cycling extends workout {
  type = 'cycling';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain;
    this.calcSpeed();
    this._setDescription();
  }
  calcSpeed() {
    //km
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

// const run1 = new Running([39, -12], 5.2, 24, 178);
// const cycling1 = new Cycling([39, -12], 27.2, 54, 578);
// console.log(run1, cycling1);
//////////////////////////////////////////
/////app arci
class App {
  #map;
  #mapZoom = 13;
  #mapEvent;
  #workout = [];

  constructor() {
    //gets the pos
    this._getposition();

    ///gets the data
    this._getLocalStorage();

    form.addEventListener('submit', this._newWorkout.bind(this));
    inputType.addEventListener('change', this._toggleElevationField);
    containerWorkouts.addEventListener('click', this._moveToPopop.bind(this));

    // Event delegation for delete button
    containerWorkouts.addEventListener('click', function (event) {
      const deleteButton = event.target.closest('.workout__delete');
      if (deleteButton) {
        const workoutId = deleteButton.getAttribute('data-id');
        app.deleteWorkout(workoutId);
      }
    });
  }
  _getposition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert('could not get your posititon');
        }
      );
  }
  _loadMap(position) {
    const { latitude, longitude } = position.coords;
    const coords = [latitude, longitude];

    this.#map = L.map('map').setView(coords, this.#mapZoom);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._showForm.bind(this));

    this.#workout.forEach(work => {
      this._renderWorkoutMarker(work);
    });
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove('hidden');
    inputDistance.focus();
  }
  _hideForm() {
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';
    form.computedStyleMap.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.computedStyleMap.display = 'grid'));
  }

  _toggleElevationField() {
    inputElevation.closest('.form__row').classList.toggle('form__row--hidden');
    inputCadence.closest('.form__row').classList.toggle('form__row--hidden');
  }
  _newWorkout(e) {
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp));
    const allPos = (...inputs) => inputs.every(inp => inp > 0);

    e.preventDefault();
    ///////////////////
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;

    //////////////////

    //////////////////
    if (type === 'running') {
      const cadence = +inputCadence.value;
      if (
        !validInputs(distance, duration, cadence) ||
        !allPos(distance, duration, cadence)
      )
        return alert('inputs have to be positive');
      workout = new Running([lat, lng], distance, duration, cadence);
    }

    //////////////////
    if (type === 'cycling') {
      const elevation = +inputCadence.value;
      if (
        !validInputs(distance, duration, elevation) ||
        !allPos(distance, duration)
      )
        return alert('inputs have to be positive');
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }
    //////////////////
    this.#workout.push(workout);

    //////////////////
    this._renderWorkoutMarker(workout);

    ///
    this._renderWorkout(workout);

    //////////////////

    this._hideForm();
    ////////
    this._setLocalStorage();
  }
  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map) ///im getting  error here
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === 'running' ? '🏃‍♂️' : '🚲'}${workout.description}`
      )
      .openPopup();
  }
  _renderWorkout(workout) {
    let html = `<li class="workout workout--${workout.type}" data-id="${
      workout.id
    }">
      <h2 class="workout__title">${workout.description}</h2>
      <div class="workout__details">
        <span class="workout__icon">${
          workout.type === 'running' ? '🏃‍♂️' : '🚲'
        }</span>
        <span class="workout__value">${workout.distance}</span>
        <span class="workout__unit">km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⏱</span>
        <span class="workout__value">${workout.duration}</span>
        <span class="workout__unit">min</span>
      </div>`;

    if (workout.type === 'running') {
      html += `<div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.pace.toFixed(1)}</span>
        <span class="workout__unit">min/km</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">🦶🏼</span>
        <span class="workout__value">${workout.cadence}</span>
        <span class="workout__unit">spm</span>
      </div>`;
    }

    if (workout.type === 'cycling') {
      html += `<div class="workout__details">
        <span class="workout__icon">⚡️</span>
        <span class="workout__value">${workout.speed.toFixed(1)}</span>
        <span class="workout__unit">km/h</span>
      </div>
      <div class="workout__details">
        <span class="workout__icon">⛰</span>
        <span class="workout__value">${workout.elevationGain}</span>
        <span class="workout__unit">m</span>
      </div>`;
    }

    // Add a delete button inside the li element
    html += `
     <button class="workout__delete" data-id="${workout.id}">Delete</button>
     </li>`;

    form.insertAdjacentHTML('afterend', html);
  }

  deleteWorkout(workoutId) {
    const workoutIndex = this.#workout.findIndex(
      workout => workout.id === workoutId
    );

    if (workoutIndex !== -1) {
      const deletedWorkout = this.#workout[workoutIndex];

      // Remove the workout marker from the map
      this._removeWorkoutMarker(deletedWorkout);

      this.#workout.splice(workoutIndex, 1);
      this._setLocalStorage();

      // Remove the workout from the UI
      const workoutElement = document.querySelector(
        `.workout[data-id="${workoutId}"]`
      );
      if (workoutElement) workoutElement.remove();
    }
  }

  _removeWorkoutMarker(workout) {
    this.#map.eachLayer(layer => {
      if (layer instanceof L.Marker) {
        const markerCoords = layer.getLatLng();
        if (
          markerCoords.lat === workout.coords[0] &&
          markerCoords.lng === workout.coords[1]
        ) {
          this.#map.removeLayer(layer);
        }
      }
    });
  }

  _moveToPopop(e) {
    const workoutEl = e.target.closest('.workout');

    if (!workoutEl) return;

    const workout = this.#workout.find(
      work => work.id === workoutEl.dataset.id
    );

    this.#map.setView(workout.coords, this.#mapZoom, {
      animate: true,
      pan: { duration: 1 },
    });

    //iworkout.click();
  }
  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workout));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem('workouts'));
    console.log(data);
    if (!data) return;
    this.#workout = data;
    this.#workout.forEach(work => {
      this._renderWorkout(work);
    });
  }
  reset() {
    localStorage.removeItem('workouts');
    location.reload();
  }
}

const app = new App();
