import { main, observerGridCalc } from './bearingrangemils.js';

// Fire mission structure
let fireMissions = [{
  name: 'Mission 1',
  TargetEasting: null,
  TargetNorthing: null,
  TargetHeight: null,
  ObserverEasting: null,
  ObserverNorthing: null,
  ObserverBearing: null,
  ObserverRangeToTgt: null,
  ObserverAltitude: null,
  adjustFireRange: null,
  adjustFireBearing: null,
  HasPressedCalculate: false,
  firingSolutions: {}
}];

let selectedMissionIndex = 0;

window.onload = function () {
  setActiveTab('Without Forward Observer');
  displayFireMissions();
};

window.addNewMission = function () {
  const missionIndex = fireMissions.length;
  fireMissions.push({
    name: `Mission ${missionIndex + 1}`,
    TargetEasting: null,
    TargetNorthing: null,
    TargetHeight: null,
    ObserverEasting: null,
    ObserverNorthing: null,
    ObserverBearing: null,
    ObserverRangeToTgt: null,
    ObserverAltitude: null,
    adjustFireRange: null,
    adjustFireBearing: null,
    HasPressedCalculate: false,
    firingSolutions: {}
  });
  displayFireMissions();
};

window.recallMissionData = function () {
  const mission = fireMissions[selectedMissionIndex];
  const fields = [
    { id: 'target-easting', value: mission.TargetEasting },
    { id: 'target-northing', value: mission.TargetNorthing },
    { id: 'target-height', value: mission.TargetHeight },
    { id: 'observer-easting', value: mission.ObserverEasting },
    { id: 'observer-northing', value: mission.ObserverNorthing },
    { id: 'observer-bearing', value: mission.ObserverBearing },
    { id: 'observer-range', value: mission.ObserverRangeToTgt },
    { id: 'observer-altitude', value: mission.ObserverAltitude },
    { id: 'fire-adjustment-bearing', value: mission.adjustFireBearing },
    { id: 'fire-adjustment-distance', value: mission.adjustFireRange }
  ];

  fields.forEach(field => {
    const inputElement = document.getElementById(field.id);
    if (inputElement) inputElement.value = field.value || '';
  });
};

window.displayFireMissions = function () {
  const missionsContainer = document.querySelector('.fire-missions');
  missionsContainer.innerHTML = '';

  fireMissions.forEach((mission, index) => {
    const missionElement = document.createElement('div');
    missionElement.classList.add('mission-box');
    if (index === selectedMissionIndex) missionElement.classList.add('active');

    const missionNameInput = document.createElement('input');
    missionNameInput.type = 'text';
    missionNameInput.value = mission.name;
    missionNameInput.readOnly = true;
    missionElement.appendChild(missionNameInput);

    const editButton = document.createElement('button');
    editButton.classList.add('edit-btn');
    editButton.innerHTML = '✏️';
    editButton.addEventListener('click', () => renameMission(index));
    missionElement.appendChild(editButton);

    const deleteButton = document.createElement('button');
    deleteButton.classList.add('delete-btn');
    deleteButton.innerHTML = '❌';
    deleteButton.addEventListener('click', () => deleteMission(index));
    missionElement.appendChild(deleteButton);

    missionElement.addEventListener('click', () => selectMission(index));
    missionsContainer.appendChild(missionElement);
  });

  const newMissionBtn = document.createElement('div');
  newMissionBtn.classList.add('new-mission');
  newMissionBtn.innerText = '+ New Mission';
  newMissionBtn.addEventListener('click', addNewMission);
  missionsContainer.appendChild(newMissionBtn);
};

window.renameMission = function (index) {
  const missionElement = document.querySelectorAll('.mission-box input')[index];
  missionElement.readOnly = false;
  missionElement.focus();
  const onBlur = () => {
    fireMissions[index].name = missionElement.value || `Mission ${index + 1}`;
    missionElement.readOnly = true;
    displayFireMissions();
  };
  missionElement.addEventListener('blur', onBlur, { once: true });
};

window.deleteMission = function (index) {
  if (fireMissions.length > 1) {
    fireMissions.splice(index, 1);
    if (selectedMissionIndex >= fireMissions.length) selectedMissionIndex = fireMissions.length - 1;
    displayFireMissions();
    selectMission(selectedMissionIndex);
  } else {
    alert("You need at least one mission.");
  }
};

window.selectMission = function (index) {
  selectedMissionIndex = index;
  displayFireMissions();
  recallMissionData();
  updateAdjustFireButton();
  displayFiringSolution();
  showWithoutObserver(); // Switch to "Without Forward Observer" tab
};

window.setActiveTab = function (tabName) {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.classList.toggle('active', tab.textContent.includes(tabName));
  });
  recallMissionData();
};

window.showWithoutObserver = function () {
  setActiveTab('Without Forward Observer');
  const mission = fireMissions[selectedMissionIndex];
  document.getElementById('inputs-container').innerHTML = `
    <input type="text" id="target-easting" placeholder="Target Easting (5 digits)" value="${mission.TargetEasting || ''}">
    <div class="error" id="easting-error"></div>
    <input type="text" id="target-northing" placeholder="Target Northing (5 digits)" value="${mission.TargetNorthing || ''}">
    <div class="error" id="northing-error"></div>
    <input type="text" id="target-height" placeholder="Target Height (Meters)" value="${mission.TargetHeight || ''}">
    <div class="error" id="target-height-error"></div>
  `;
};

window.showWithObserver = function () {
  setActiveTab('With Forward Observer');
  const mission = fireMissions[selectedMissionIndex];
  document.getElementById('inputs-container').innerHTML = `
    <input type="text" id="observer-easting" placeholder="Observer Easting (5 digits)" value="${mission.ObserverEasting || ''}">
    <div class="error" id="observer-easting-error"></div>
    <input type="text" id="observer-northing" placeholder="Observer Northing (5 digits)" value="${mission.ObserverNorthing || ''}">
    <div class="error" id="observer-northing-error"></div>
    <input type="text" id="observer-bearing" placeholder="Observer Bearing to Target (0-360 degrees)" value="${mission.ObserverBearing || ''}">
    <div class="error" id="bearing-error"></div>
    <input type="text" id="observer-range" placeholder="Observer Range to Target (Meters)" value="${mission.ObserverRangeToTgt || ''}">
    <div class="error" id="observer-range-error"></div>
    <input type="text" id="observer-altitude" placeholder="Observers Estimation of target altitude (Meters)" value="${mission.ObserverAltitude || ''}">
    <div class="error" id="observer-altitude-error"></div>
  `;
};

window.showAdjustFire = function () {
  setActiveTab('Adjust Fire');
  const mission = fireMissions[selectedMissionIndex];
  document.getElementById('inputs-container').innerHTML = `
    <div>New Target Grid (after adjustment):</div>
    <div>Easting: <span id="adjust-new-easting">${mission.TargetEasting || 'N/A'}</span></div>
    <div>Northing: <span id="adjust-new-northing">${mission.TargetNorthing || 'N/A'}</span></div>
    <input type="text" id="fire-adjustment-bearing" placeholder="Bearing Of Adjustment (0-360 degrees)" value="${mission.adjustFireBearing || ''}">
    <div class="error" id="adjustment-bearing-error"></div>
    <input type="text" id="fire-adjustment-distance" placeholder="Distance Of Adjustment (Meters)" value="${mission.adjustFireRange || ''}">
    <div class="error" id="adjustment-range-error"></div>
  `;
};

window.updateAdjustFireButton = function () {
  const mission = fireMissions[selectedMissionIndex];
  const adjustFireBtn = document.getElementById('adjust-fire-btn');
  if (mission.HasPressedCalculate) {
    adjustFireBtn.disabled = false;
    adjustFireBtn.classList.remove('disabled-button');
    adjustFireBtn.innerHTML = 'Adjust Fire';
    adjustFireBtn.onclick = showAdjustFire;
  } else {
    adjustFireBtn.disabled = true;
    adjustFireBtn.classList.add('disabled-button');
    adjustFireBtn.innerHTML = 'Adjust Fire ❌';
    adjustFireBtn.onclick = () => alert('You must calculate a solution first to adjust fire');
  }
};

window.start = function () {
  const launcherEasting = document.getElementById('initial-launcher-easting');
  const launcherNorthing = document.getElementById('initial-launcher-northing');
  const launcherHeight = document.getElementById('initial-launcher-height');

  let valid = true;

  if (launcherEasting.value.length !== 5 || isNaN(launcherEasting.value)) {
    document.getElementById('initial-easting-error').textContent = "Must be a 5-digit number.";
    valid = false;
  } else {
    document.getElementById('initial-easting-error').textContent = "";
  }

  if (launcherNorthing.value.length !== 5 || isNaN(launcherNorthing.value)) {
    document.getElementById('initial-northing-error').textContent = "Must be a 5-digit number.";
    valid = false;
  } else {
    document.getElementById('initial-northing-error').textContent = "";
  }

  if (isNaN(launcherHeight.value) || launcherHeight.value === '') {
    document.getElementById('initial-height-error').textContent = "Must be a valid number.";
    valid = false;
  } else {
    document.getElementById('initial-height-error').textContent = "";
  }

  if (valid) {
    document.getElementById('initial-overlay').style.display = 'none';
    document.getElementById('main-container').style.display = 'flex';
    document.getElementById('launcher-easting').value = launcherEasting.value;
    document.getElementById('launcher-northing').value = launcherNorthing.value;
    document.getElementById('launcher-height').value = launcherHeight.value;
    showWithoutObserver();
  }
};

// Helper function to pad a number with trailing zeros to 5 digits
function padToFiveDigits(value) {
  const numStr = String(value).replace(/\D/g, ''); // Remove non-digits
  return numStr.padEnd(5, '0').slice(0, 5); // Pad with zeros, ensure 5 digits
}

window.calculate = function () {
  const mission = fireMissions[selectedMissionIndex];
  const activeTab = document.querySelector('.tab.active')?.textContent || '';

  const launcherEasting = Number(document.getElementById('launcher-easting').value);
  const launcherNorthing = Number(document.getElementById('launcher-northing').value);
  const launcherHeight = Number(document.getElementById('launcher-height').value);

  let valid = true;

  if (activeTab.includes('Without Forward Observer')) {
    const targetEasting = document.getElementById('target-easting');
    const targetNorthing = document.getElementById('target-northing');
    const targetHeight = document.getElementById('target-height');

    // Pad easting and northing to 5 digits
    const paddedTargetEasting = padToFiveDigits(targetEasting.value);
    const paddedTargetNorthing = padToFiveDigits(targetNorthing.value);

    if (paddedTargetEasting.length !== 5 || isNaN(paddedTargetEasting)) {
      document.getElementById('easting-error').textContent = "Must be a 5-digit number.";
      valid = false;
    } else {
      document.getElementById('easting-error').textContent = "";
      targetEasting.value = paddedTargetEasting; // Update input field
    }

    if (paddedTargetNorthing.length !== 5 || isNaN(paddedTargetNorthing)) {
      document.getElementById('northing-error').textContent = "Must be a 5-digit number.";
      valid = false;
    } else {
      document.getElementById('northing-error').textContent = "";
      targetNorthing.value = paddedTargetNorthing; // Update input field
    }

    if (isNaN(targetHeight.value) || targetHeight.value === '') {
      document.getElementById('target-height-error').textContent = "Must be a valid number.";
      valid = false;
    } else {
      document.getElementById('target-height-error').textContent = "";
    }

    if (valid) {
      mission.TargetEasting = paddedTargetEasting;
      mission.TargetNorthing = paddedTargetNorthing;
      mission.TargetHeight = targetHeight.value;
      mission.firingSolutions = main(
        launcherEasting,
        launcherNorthing,
        launcherHeight,
        Number(paddedTargetEasting),
        Number(paddedTargetNorthing),
        Number(targetHeight.value)
      );
    }
  } else if (activeTab.includes('With Forward Observer')) {
    const observerEasting = document.getElementById('observer-easting');
    const observerNorthing = document.getElementById('observer-northing');
    const observerBearing = document.getElementById('observer-bearing');
    const observerRange = document.getElementById('observer-range');
    const observerAltitude = document.getElementById('observer-altitude');

    // Pad easting and northing to 5 digits
    const paddedObserverEasting = padToFiveDigits(observerEasting.value);
    const paddedObserverNorthing = padToFiveDigits(observerNorthing.value);

    if (paddedObserverEasting.length !== 5 || isNaN(paddedObserverEasting)) {
      document.getElementById('observer-easting-error').textContent = "Must be a 5-digit number.";
      valid = false;
    } else {
      document.getElementById('observer-easting-error').textContent = "";
      observerEasting.value = paddedObserverEasting; // Update input field
    }

    if (paddedObserverNorthing.length !== 5 || isNaN(paddedObserverNorthing)) {
      document.getElementById('observer-northing-error').textContent = "Must be a 5-digit number.";
      valid = false;
    } else {
      document.getElementById('observer-northing-error').textContent = "";
      observerNorthing.value = paddedObserverNorthing; // Update input field
    }

    if (isNaN(observerBearing.value) || observerBearing.value < 0 || observerBearing.value > 360) {
      document.getElementById('bearing-error').textContent = "Must be between 0 and 360.";
      valid = false;
    } else {
      document.getElementById('bearing-error').textContent = "";
    }

    if (isNaN(observerRange.value) || observerRange.value === '' || Number(observerRange.value) < 0) {
      document.getElementById('observer-range-error').textContent = "Must be a positive number.";
      valid = false;
    } else {
      document.getElementById('observer-range-error').textContent = "";
    }

    if (isNaN(observerAltitude.value) || observerAltitude.value === '') {
      document.getElementById('observer-altitude-error').textContent = "Must be a valid number.";
      valid = false;
    } else {
      document.getElementById('observer-altitude-error').textContent = "";
    }

    if (valid) {
      mission.ObserverEasting = paddedObserverEasting;
      mission.ObserverNorthing = paddedObserverNorthing;
      mission.ObserverBearing = observerBearing.value;
      mission.ObserverRangeToTgt = observerRange.value;
      mission.ObserverAltitude = observerAltitude.value;
      mission.firingSolutions = observerGridCalc(
        launcherNorthing,
        launcherEasting,
        launcherHeight,
        Number(paddedObserverEasting),
        Number(paddedObserverNorthing),
        Number(observerBearing.value),
        Number(observerRange.value),
        Number(observerAltitude.value)
      );
      mission.TargetEasting = mission.firingSolutions.updatedEastingTarget;
      mission.TargetNorthing = mission.firingSolutions.updatedNorthingTarget;
    }
  } else if (activeTab.includes('Adjust Fire')) {
    const adjustFireBearing = document.getElementById('fire-adjustment-bearing');
    const adjustFireRange = document.getElementById('fire-adjustment-distance');

    if (isNaN(adjustFireBearing.value) || adjustFireBearing.value < 0 || adjustFireBearing.value > 360) {
      document.getElementById('adjustment-bearing-error').textContent = "Must be between 0 and 360.";
      valid = false;
    } else {
      document.getElementById('adjustment-bearing-error').textContent = "";
    }

    if (isNaN(adjustFireRange.value) || adjustFireRange.value === '' || Number(adjustFireRange.value) < 0) {
      document.getElementById('adjustment-range-error').textContent = "Must be a positive number.";
      valid = false;
    } else {
      document.getElementById('adjustment-range-error').textContent = "";
    }

    if (valid && mission.TargetEasting && mission.TargetNorthing) {
      mission.adjustFireBearing = adjustFireBearing.value;
      mission.adjustFireRange = adjustFireRange.value;

      const bearingRad = Number(adjustFireBearing.value) * (Math.PI / 180);
      const adjustDistance = Number(adjustFireRange.value);
      const newTargetEasting = Number(mission.TargetEasting) + adjustDistance * Math.sin(bearingRad);
      const newTargetNorthing = Number(mission.TargetNorthing) + adjustDistance * Math.cos(bearingRad);

      mission.TargetEasting = newTargetEasting.toFixed(0);
      mission.TargetNorthing = newTargetNorthing.toFixed(0);

      mission.firingSolutions = main(
        launcherEasting,
        launcherNorthing,
        launcherHeight,
        newTargetEasting,
        newTargetNorthing,
        Number(mission.TargetHeight || 0)
      );

      document.getElementById('inputs-container').innerHTML = `
        <div>New Target Grid (after adjustment):</div>
        <div>Easting: <span id="adjust-new-easting">${mission.TargetEasting}</span></div>
        <div>Northing: <span id="adjust-new-northing">${mission.TargetNorthing}</span></div>
        <input type="text" id="fire-adjustment-bearing" placeholder="Bearing Of Adjustment (0-360 degrees)" value="${mission.adjustFireBearing || ''}">
        <div class="error" id="adjustment-bearing-error"></div>
        <input type="text" id="fire-adjustment-distance" placeholder="Distance Of Adjustment (Meters)" value="${mission.adjustFireRange || ''}">
        <div class="error" id="adjustment-range-error"></div>
      `;
    } else if (!mission.TargetEasting || !mission.TargetNorthing) {
      alert('No previous target data available for adjustment.');
      valid = false;
    }
  }

  if (valid) {
    mission.HasPressedCalculate = true;
    updateAdjustFireButton();
    displayFiringSolution();
  }
};

window.displayFiringSolution = function () {
  const mission = fireMissions[selectedMissionIndex];
  const solution = mission.firingSolutions || {};
  // Convert mils to degrees
  let degreesIndirect = (solution.milsIndirect || 0) * (360 / 6400);
  let degreesDirect = (solution.milsDirect || 0) * (360 / 6400);
  // Apply 0.4° offset for indirect angles above 60°
  if (degreesIndirect > 60) {
    degreesIndirect += 0.4;
  }
  document.querySelector('.firing-solution').innerHTML = `
    <div>Range: ${solution.horizontalDistance?.toFixed(2) || '00'}<br>Bearing: ${solution.bearingDeg || '00.00'}</div>
    <div class="vertical-line"></div>
    <div>Indirect Deg: ${degreesIndirect.toFixed(2) || '00.00'}<br>TOF: ${solution.tofIndirect || '00.00'}</div>
    <div class="vertical-line"></div>
    <div>Direct Deg: ${degreesDirect.toFixed(2) || '00.00'}<br>TOF: ${solution.tofDirect || '00.00'}</div>
  `;
};