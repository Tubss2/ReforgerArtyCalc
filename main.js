import { main, observerGridCalc } from './bearingrangemils.js';
console.log("main.js loaded");

// Attach all functions to window for global access (do this AFTER defining them)
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
  firingSolutions: {},
  spread: {
    bearing: null,
    indirect: { mils: null },
    direct: { mils: null },
    bearingSolution: null,
    elevationSolution: null
  }
}];

let selectedMissionIndex = 0;

const gunParameters = {
  'wz-m119': { mass: 23, drag: 0.0043, velocity: 212.5 },
  'm252-0': { mass: 4.06, drag: 0.0004620, velocity: 66 },
  'm252-1': { mass: 4.06, drag: 0.0004620, velocity: 101.046 },
  'm252-2': { mass: 4.06, drag: 0.0004620, velocity: 137.61 },
  'm252-3': { mass: 4.06, drag: 0.0004620, velocity: 167.706 },
  'm252-4': { mass: 4.06, drag: 0.0004620, velocity: 196.482 }
};

// Define all functions first
function start() {
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
}

function showAdjustFire() {
  console.log("showAdjustFire called");
  setActiveTab('Adjust Fire');
  const mission = fireMissions[selectedMissionIndex];
  
  let spreadText = '';
  if (mission.spread && mission.spread.bearingSolution && mission.spread.elevationSolution) {
    const elevationDiffDegrees = (Number(mission.spread.elevationSolution) * 0.05625).toFixed(2);
    spreadText = `
      Adjust bearing ± ${mission.spread.bearingSolution}°<br>
      Adjust elevation ± ${elevationDiffDegrees}°
    `;
  }

  const calculateButtonDisabled = mission.HasPressedCalculate ? '' : 'disabled';

  document.getElementById('inputs-container').innerHTML = `
    <div style="float: left; width: 50%;">
      <div>New Target Grid (after adjustment):</div>
      <div>Easting: <span id="adjust-new-easting">${mission.TargetEasting || 'N/A'}</span></div>
      <div>Northing: <span id="adjust-new-northing">${mission.TargetNorthing || 'N/A'}</span></div>
      <input type="text" id="fire-adjustment-bearing" placeholder="Bearing Of Adjustment (0-360 degrees)" value="${mission.adjustFireBearing || ''}">
      <div class="error" id="adjustment-bearing-error"></div>
      <input type="text" id="fire-adjustment-distance" placeholder="Distance Of Adjustment (Meters)" value="${mission.adjustFireRange || ''}">
      <div class="error" id="adjustment-range-error"></div>
    </div>
    <div style="float: right; width: 50%; text-align: right;">
      <input type="text" id="manual-spread" placeholder="Manual Spread (Meters)">
      <button id="calculate-spread-btn" style="margin-top: 10px;" ${calculateButtonDisabled}>Calculate Spread</button>
      <div id="spread-adjustment-text" style="margin-top: 10px;">${spreadText}</div>
    </div>
    <div style="clear: both;"></div>
    <div class="calculate-button">
      <button id="calculate-adjustment-btn" ${calculateButtonDisabled}>Calculate Adjustment</button>
    </div>
  `;

  const calcAdjustBtn = document.getElementById('calculate-adjustment-btn');
  const calcSpreadBtn = document.getElementById('calculate-spread-btn');
  
  if (mission.HasPressedCalculate) {
    calcAdjustBtn.addEventListener('click', calculate);
    calcSpreadBtn.addEventListener('click', calculateSpread);
  } else {
    calcAdjustBtn.addEventListener('click', () => alert('You must calculate a solution first to adjust fire'));
    calcSpreadBtn.addEventListener('click', () => alert('You must calculate a solution first to adjust fire'));
  }
}

function calculateSpread() {
  const mission = fireMissions[selectedMissionIndex];
  const spreadInput = document.getElementById('manual-spread');
  const spreadValue = Number(spreadInput.value);

  if (isNaN(spreadValue) || spreadValue <= 0) {
    alert('Please enter a valid positive number for Manual Spread.');
    return;
  }

  const currentEasting = Number(mission.TargetEasting);
  const currentNorthing = Number(mission.TargetNorthing);
  
  const spreadEasting = currentEasting + spreadValue;
  const spreadNorthing = currentNorthing + spreadValue;

  const launcherEasting = Number(document.getElementById('launcher-easting').value);
  const launcherNorthing = Number(document.getElementById('launcher-northing').value);
  const launcherHeight = Number(document.getElementById('launcher-height').value);
  const targetHeight = Number(mission.TargetHeight || 0);

  const spreadSolution = main(
    launcherEasting,
    launcherNorthing,
    launcherHeight,
    spreadEasting,
    spreadNorthing,
    targetHeight
  );

  mission.spread = {
    bearing: spreadSolution.bearingDeg,
    indirect: { mils: spreadSolution.milsIndirect },
    direct: { mils: spreadSolution.milsDirect }
  };

  const currentBearing = Number(mission.firingSolutions.bearingDeg);
  const spreadBearing = Number(spreadSolution.bearingDeg);
  const bearingDiff = Math.abs(spreadBearing - currentBearing);

  const currentIndirectMils = mission.firingSolutions.milsIndirect;
  const spreadIndirectMils = spreadSolution.milsIndirect;
  const elevationDiff = Math.abs(spreadIndirectMils - currentIndirectMils);

  // Store the differences for potential future use
  mission.spread.bearingSolution = bearingDiff.toFixed(2);
  mission.spread.elevationSolution = elevationDiff.toFixed(2);

  // Calculate bearing limits with wrapping
  let bearingLower = currentBearing - bearingDiff;
  let bearingUpper = currentBearing + bearingDiff;

  // Normalize bearings to 0-360°
  bearingLower = ((bearingLower % 360) + 360) % 360; // Handles negative values
  bearingUpper = ((bearingUpper % 360) + 360) % 360;

  // Calculate elevation limits in degrees
  const elevationLower = ((currentIndirectMils - elevationDiff) * 0.05625).toFixed(2);
  const elevationUpper = ((currentIndirectMils + elevationDiff) * 0.05625).toFixed(2);

  // Update the display with the new format
  document.getElementById('spread-adjustment-text').innerHTML = `
    Bearing fire between ${bearingLower.toFixed(2)}° and ${bearingUpper.toFixed(2)}°<br>
    Elevation fire between ${elevationLower}° and ${elevationUpper}°
  `;
}
function addNewMission() {
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
    firingSolutions: {},
    spread: {
      bearing: null,
      indirect: { mils: null },
      direct: { mils: null },
      bearingSolution: null,
      elevationSolution: null
    }
  });
  displayFireMissions();
}

function recallMissionData() {
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
}

function displayFireMissions() {
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
}

function renameMission(index) {
  const missionElement = document.querySelectorAll('.mission-box input')[index];
  missionElement.readOnly = false;
  missionElement.focus();
  const onBlur = () => {
    fireMissions[index].name = missionElement.value || `Mission ${index + 1}`;
    missionElement.readOnly = true;
    displayFireMissions();
  };
  missionElement.addEventListener('blur', onBlur, { once: true });
}

function deleteMission(index) {
  if (fireMissions.length > 1) {
    fireMissions.splice(index, 1);
    if (selectedMissionIndex >= fireMissions.length) selectedMissionIndex = fireMissions.length - 1;
    displayFireMissions();
    selectMission(selectedMissionIndex);
  } else {
    alert("You need at least one mission.");
  }
}

function selectMission(index) {
  selectedMissionIndex = index;
  displayFireMissions();
  recallMissionData();
  updateAdjustFireButton();
  displayFiringSolution();
  showWithoutObserver();
}

function setActiveTab(tabName) {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.classList.toggle('active', tab.textContent.includes(tabName));
  });
  recallMissionData();
}

function showWithoutObserver() {
  setActiveTab('Without Forward Observer');
  const mission = fireMissions[selectedMissionIndex];
  document.getElementById('inputs-container').innerHTML = `
    <input type="text" id="target-easting" placeholder="Target Easting (5 digits)" value="${mission.TargetEasting || ''}">
    <div class="error" id="easting-error"></div>
    <input type="text" id="target-northing" placeholder="Target Northing (5 digits)" value="${mission.TargetNorthing || ''}">
    <div class="error" id="northing-error"></div>
    <input type="text" id="target-height" placeholder="Target Height (Meters)" value="${mission.TargetHeight || ''}">
    <div class="error" id="target-height-error"></div>
    <div class="calculate-button">
      <button id="calculate-btn">Calculate</button>
    </div>
  `;
  document.getElementById('calculate-btn').addEventListener('click', calculate);
}

function showWithObserver() {
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
    <div class="calculate-button">
      <button id="calculate-btn">Calculate</button>
    </div>
  `;
  document.getElementById('calculate-btn').addEventListener('click', calculate);
}

function updateAdjustFireButton() {
  const mission = fireMissions[selectedMissionIndex];
  const adjustFireBtn = document.getElementById('adjust-fire-btn');
  if (mission.HasPressedCalculate) {
    adjustFireBtn.disabled = false;
    adjustFireBtn.classList.remove('disabled-button');
    adjustFireBtn.innerHTML = 'Adjust Fire';
  } else {
    adjustFireBtn.disabled = true;
    adjustFireBtn.classList.add('disabled-button');
    adjustFireBtn.innerHTML = 'Adjust Fire ❌';
  }
}

function padToFiveDigits(value) {
  const numStr = String(value).replace(/\D/g, '');
  return numStr.padEnd(5, '0').slice(0, 5);
}

function calculate() {
  console.log("Calculate function called");
  const selectedGun = document.getElementById('select-gun').value;
  console.log("Selected gun:", selectedGun);
  const gunParamsCurrent = gunParameters[selectedGun];
  console.log("Gun parameters:", gunParamsCurrent);
  const mission = fireMissions[selectedMissionIndex];
  console.log("Selected mission:", mission);
  const activeTab = document.querySelector('.tab.active')?.textContent || '';
  console.log("Active tab:", activeTab);

  const launcherEasting = Number(document.getElementById('launcher-easting').value);
  const launcherNorthing = Number(document.getElementById('launcher-northing').value);
  const launcherHeight = Number(document.getElementById('launcher-height').value);
  console.log("Launcher coordinates:", launcherEasting, launcherNorthing, launcherHeight);

  let valid = true;

  if (activeTab.includes('Without Forward Observer')) {
    console.log("Processing Without Forward Observer");
    const targetEasting = document.getElementById('target-easting');
    const targetNorthing = document.getElementById('target-northing');
    const targetHeight = document.getElementById('target-height');

    const paddedTargetEasting = padToFiveDigits(targetEasting.value);
    const paddedTargetNorthing = padToFiveDigits(targetNorthing.value);
    console.log("Padded target easting:", paddedTargetEasting);
    console.log("Padded target northing:", paddedTargetNorthing);

    if (paddedTargetEasting.length !== 5 || isNaN(paddedTargetEasting)) {
      document.getElementById('easting-error').textContent = "Must be a 5-digit number.";
      valid = false;
    } else {
      document.getElementById('easting-error').textContent = "";
      targetEasting.value = paddedTargetEasting;
    }

    if (paddedTargetNorthing.length !== 5 || isNaN(paddedTargetNorthing)) {
      document.getElementById('northing-error').textContent = "Must be a 5-digit number.";
      valid = false;
    } else {
      document.getElementById('northing-error').textContent = "";
      targetNorthing.value = paddedTargetNorthing;
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
      console.log("Calculating firing solutions for Without Forward Observer");
      mission.firingSolutions = main(
        launcherEasting,
        launcherNorthing,
        launcherHeight,
        Number(paddedTargetEasting),
        Number(paddedTargetNorthing),
        Number(targetHeight.value),
        gunParamsCurrent.mass,
        gunParamsCurrent.drag,
        gunParamsCurrent.velocity
      );
      console.log("Firing solutions:", mission.firingSolutions);
      mission.HasPressedCalculate = true;
    }
  } else if (activeTab.includes('With Forward Observer')) {
    console.log("Processing With Forward Observer");
    const observerEasting = document.getElementById('observer-easting');
    const observerNorthing = document.getElementById('observer-northing');
    const observerBearing = document.getElementById('observer-bearing');
    const observerRange = document.getElementById('observer-range');
    const observerAltitude = document.getElementById('observer-altitude');

    const paddedObserverEasting = padToFiveDigits(observerEasting.value);
    const paddedObserverNorthing = padToFiveDigits(observerNorthing.value);
    console.log("Padded observer easting:", paddedObserverEasting);
    console.log("Padded observer northing:", paddedObserverNorthing);

    if (paddedObserverEasting.length !== 5 || isNaN(paddedObserverEasting)) {
      document.getElementById('observer-easting-error').textContent = "Must be a 5-digit number.";
      valid = false;
    } else {
      document.getElementById('observer-easting-error').textContent = "";
      observerEasting.value = paddedObserverEasting;
    }

    if (paddedObserverNorthing.length !== 5 || isNaN(paddedObserverNorthing)) {
      document.getElementById('observer-northing-error').textContent = "Must be a 5-digit number.";
      valid = false;
    } else {
      document.getElementById('observer-northing-error').textContent = "";
      observerNorthing.value = paddedObserverNorthing;
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
      console.log("Calculating firing solutions for With Forward Observer");
      mission.firingSolutions = observerGridCalc(
        launcherNorthing,
        launcherEasting,
        launcherHeight,
        Number(paddedObserverEasting),
        Number(paddedObserverNorthing),
        Number(observerBearing.value),
        Number(observerRange.value),
        Number(observerAltitude.value),
        gunParamsCurrent.mass,
        gunParamsCurrent.drag,
        gunParamsCurrent.velocity
      );
      console.log("Firing solutions:", mission.firingSolutions);
      mission.TargetEasting = mission.firingSolutions.updatedEastingTarget;
      mission.TargetNorthing = mission.firingSolutions.updatedNorthingTarget;
      mission.HasPressedCalculate = true;
    }
  } else if (activeTab.includes('Adjust Fire')) {
    console.log("Processing Adjust Fire");
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
      console.log("New target coordinates:", newTargetEasting, newTargetNorthing);

      console.log("Calculating firing solutions for Adjust Fire");
      mission.firingSolutions = main(
        launcherEasting,
        launcherNorthing,
        launcherHeight,
        newTargetEasting,
        newTargetNorthing,
        Number(mission.TargetHeight || 0),
        gunParamsCurrent.mass,
        gunParamsCurrent.drag,
        gunParamsCurrent.velocity
      );
      console.log("Firing solutions:", mission.firingSolutions);

      mission.TargetEasting = newTargetEasting.toFixed(0);
      mission.TargetNorthing = newTargetNorthing.toFixed(0);

      document.getElementById('adjust-new-easting').textContent = mission.TargetEasting;
      document.getElementById('adjust-new-northing').textContent = mission.TargetNorthing;
      mission.HasPressedCalculate = true;
    } else if (!mission.TargetEasting || !mission.TargetNorthing) {
      alert('No previous target data available for adjustment.');
      valid = false;
    }
  }

  if (valid) {
    console.log("Updating UI with firing solutions");
    updateAdjustFireButton();
    displayFiringSolution();
    if (activeTab.includes('Adjust Fire')) {
      showAdjustFire();
    } else if (activeTab.includes('Without Forward Observer')) {
      showWithoutObserver();
    } else if (activeTab.includes('With Forward Observer')) {
      showWithObserver();
    }
  } else {
    console.log("Validation failed");
  }
}

function displayFiringSolution() {
  const mission = fireMissions[selectedMissionIndex];
  const solution = mission.firingSolutions || {};
  let degreesIndirect = (solution.milsIndirect || 0) * (360 / 6400);
  let degreesDirect = (solution.milsDirect || 0) * (360 / 6400);
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
}

window.addNewMission = addNewMission;
window.renameMission = renameMission;
window.deleteMission = deleteMission;
window.selectMission = selectMission;
window.setActiveTab = setActiveTab;
window.showWithoutObserver = showWithoutObserver;
window.showWithObserver = showWithObserver;
window.showAdjustFire = showAdjustFire;
window.updateAdjustFireButton = updateAdjustFireButton;
window.calculate = calculate;
window.displayFiringSolution = displayFiringSolution;
window.calculateSpread = calculateSpread;
window.recallMissionData = recallMissionData;
window.displayFireMissions = displayFireMissions;
window.padToFiveDigits = padToFiveDigits;

window.onload = function () {
  console.log("main.js loaded");
  setActiveTab('Without Forward Observer');
  displayFireMissions();

  const adjustFireBtn = document.getElementById('adjust-fire-btn');
  adjustFireBtn.addEventListener('click', function () {
    const mission = fireMissions[selectedMissionIndex];
    if (mission.HasPressedCalculate) {
      showAdjustFire();
    } else {
      alert('You must calculate a solution first to adjust fire');
    }
  });

  updateAdjustFireButton();
};