import { main, observerGridCalc } from './bearingrangemils.js';
console.log("main.js loaded");


// Initialize fire missions with spread variables
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

// Function to show the "Adjust Fire" tab
window.showAdjustFire = function () {
  setActiveTab('Adjust Fire');
  const mission = fireMissions[selectedMissionIndex];
  
  // Preserve spread adjustment text if calculated
  let spreadText = '';
  if (mission.spread && mission.spread.bearingSolution && mission.spread.elevationSolution) {
    const elevationDiffDegrees = (Number(mission.spread.elevationSolution) * 0.05625).toFixed(2);
    spreadText = `
      Adjust bearing ± ${mission.spread.bearingSolution}°<br>
      Adjust elevation ± ${elevationDiffDegrees}°
    `;
  }

  // Populate inputs-container with Adjust Fire content
  document.getElementById('inputs-container').innerHTML = `
    <div style="float: left; width: 50%;">
      <input type="text" id="fire-adjustment-bearing" placeholder="Bearing Of Adjustment (0-360 degrees)" value="${mission.adjustFireBearing || ''}">
      <div class="error" id="adjustment-bearing-error"></div>
      <input type="text" id="fire-adjustment-distance" placeholder="Distance Of Adjustment (Meters)" value="${mission.adjustFireRange || ''}">
      <div class="error" id="adjustment-range-error"></div>
      <button id="calculate-adjustment-btn" style="margin-top: 10px;">Calculate Adjustment</button>
    </div>
    <div style="float: right; width: 50%; text-align: right;">
      <input type="text" id="manual-spread" placeholder="Manual Spread (Meters)">
      <button id="calculate-spread-btn" style="margin-top: 10px;">Calculate Spread</button>
      <div id="spread-adjustment-text" style="margin-top: 10px;">${spreadText}</div>
    </div>
    <div style="clear: both;"></div>
  `;

  // Add event listeners
  document.getElementById('calculate-adjustment-btn').addEventListener('click', calculate);
  document.getElementById('calculate-spread-btn').addEventListener('click', calculateSpread);
};

// Function to calculate spread
window.calculateSpread = function () {
  const mission = fireMissions[selectedMissionIndex];
  const spreadInput = document.getElementById('manual-spread');
  const spreadValue = Number(spreadInput.value);

  // Validate input
  if (isNaN(spreadValue) || spreadValue <= 0) {
    alert('Please enter a valid positive number for Manual Spread.');
    return;
  }

  // Get current coordinates
  const currentEasting = Number(mission.TargetEasting);
  const currentNorthing = Number(mission.TargetNorthing);
  
  // Calculate temporary spread coordinates (do not update mission)
  const spreadEasting = currentEasting + spreadValue;
  const spreadNorthing = currentNorthing + spreadValue;

  // Get launcher data
  const launcherEasting = Number(document.getElementById('launcher-easting').value);
  const launcherNorthing = Number(document.getElementById('launcher-northing').value);
  const launcherHeight = Number(document.getElementById('launcher-height').value);
  const targetHeight = Number(mission.TargetHeight || 0);

  // Calculate spread firing solution
  const spreadSolution = main(
    launcherEasting,
    launcherNorthing,
    launcherHeight,
    spreadEasting,
    spreadNorthing,
    targetHeight
  );

  // Store spread results
  mission.spread = {
    bearing: spreadSolution.bearingDeg,
    indirect: { mils: spreadSolution.milsIndirect },
    direct: { mils: spreadSolution.milsDirect }
  };

  // Calculate differences
  const currentBearing = Number(mission.firingSolutions.bearingDeg);
  const spreadBearing = Number(spreadSolution.bearingDeg);
  const bearingDiff = Math.abs(spreadBearing - currentBearing);

  const currentIndirectMils = mission.firingSolutions.milsIndirect;
  const spreadIndirectMils = spreadSolution.milsIndirect;
  const elevationDiff = Math.abs(spreadIndirectMils - currentIndirectMils);

  // Store differences
  mission.spread.bearingSolution = bearingDiff.toFixed(2);
  mission.spread.elevationSolution = elevationDiff.toFixed(2);

  // Update display
  document.getElementById('spread-adjustment-text').innerHTML = `
    Adjust bearing ± ${mission.spread.bearingSolution}°<br>
    Adjust elevation ± ${mission.spread.elevationSolution} mils
  `;
};

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

window.onload = function () {
  setActiveTab('Without Forward Observer');
  displayFireMissions();
  // Add event listener for Adjust Fire button
  const adjustFireBtn = document.getElementById('adjust-fire-btn');
  updateAdjustFireButton(); // Set initial state
  adjustFireBtn.addEventListener('click', showAdjustFire);
};

// Update updateAdjustFireButton to manage the button's state
window.updateAdjustFireButton = function () {
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
};

// Ensure calculate sets HasPressedCalculate
window.calculate = function () {
  const mission = fireMissions[selectedMissionIndex];
  const activeTab = document.querySelector('.tab.active')?.textContent || '';

  const launcherEasting = Number(document.getElementById('launcher-easting').value);
  const launcherNorthing = Number(document.getElementById('launcher-northing').value);
  const launcherHeight = Number(document.getElementById('launcher-height').value);

  let valid = true;

  if (activeTab.includes('Without Forward Observer')) {
    // ... (existing validation and calculation logic) ...
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
      mission.HasPressedCalculate = true; // Set to true after successful calculation
    }
  } else if (activeTab.includes('With Forward Observer')) {
    // ... (existing validation and calculation logic) ...
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
      mission.HasPressedCalculate = true; // Set to true after successful calculation
    }
  } else if (activeTab.includes('Adjust Fire')) {
    // ... (existing validation and calculation logic) ...
    if (valid && mission.TargetEasting && mission.TargetNorthing) {
      mission.adjustFireBearing = adjustFireBearing.value;
      mission.adjustFireRange = adjustFireRange.value;
      // ... (rest of the calculation) ...
      mission.HasPressedCalculate = true; // Set to true after successful adjustment
    }
  }

  if (valid) {
    updateAdjustFireButton(); // Update button state
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