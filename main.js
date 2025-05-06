import { main, observerGridCalc } from './bearingrangemils.js';
console.log("main.js loaded");

// Attach all functions to window for global access (do this AFTER defining them)
let fireMissions = [{
  name: 'Mission 1',
  TargetEasting: null,
  TargetNorthing: null,
  TargetHeight: null,
  ObserverBearing: null, // Only included for "With Forward Observer" missions
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
  'wz-m119': { mass: 23, drag: 0.0008, velocity: 240 },
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
  const observerBearing = mission.ObserverBearing !== null ? mission.ObserverBearing : '0';

  // Initialize cumulative adjustment values from mission data or default to 0
  const cumulativeAdd = mission.adjustments?.add || 0;
  const cumulativeDrop = mission.adjustments?.drop || 0;
  const cumulativeLeft = mission.adjustments?.left || 0;
  const cumulativeRight = mission.adjustments?.right || 0;

  document.getElementById('inputs-container').innerHTML = `
      <!-- Left Side: Adjustment Inputs -->
      <div style="float: left; width: 50%;">
          <div>New Target Grid (after adjustment):</div>
          <div>Easting: <span id="adjust-new-easting">${mission.TargetEasting || 'N/A'}</span></div>
          <div>Northing: <span id="adjust-new-northing">${mission.TargetNorthing || 'N/A'}</span></div>
          <input type="text" id="fire-adjustment-bearing" placeholder="Bearing Of Adjustment (0-360 degrees)" value="${mission.adjustFireBearing || ''}">
          <div class="error" id="adjustment-bearing-error"></div>
          <input type="text" id="fire-adjustment-distance" placeholder="Distance Of Adjustment (Meters)" value="${mission.adjustFireRange || ''}">
          <div class="error" id="adjustment-range-error"></div>
      </div>
      <!-- Right Side: Spread Inputs -->
      <div style="float: right; width: 50%; text-align: right;">
          <input type="text" id="manual-spread" placeholder="Manual Spread (Meters)">
          <button id="calculate-spread-btn" style="margin-top: 10px;" ${calculateButtonDisabled}>Calculate Spread</button>
          <div id="spread-adjustment-text" style="margin-top: 10px;">${spreadText}</div>
      </div>
      <div style="clear: both;"></div>
      <!-- Center Section: Adjustment Buttons and Inputs -->
      <div class="adjust-fire-buttons" style="display: flex; justify-content: center; align-items: center; gap: 20px; margin-top: 20px;">
          <!-- Left Section: Left Input and Buttons -->
          <div style="display: flex; align-items: center; gap: 10px;">
              <input type="text" id="left-input" value="${cumulativeLeft}" style="width: 50px; text-align: center;" placeholder="Left">
              <div class="error" id="left-error"></div>
              <div style="display: flex; flex-direction: row; gap: 10px;">
                  <button id="left-50-btn" ${calculateButtonDisabled}>Left 50</button>
                  <button id="left-10-btn" ${calculateButtonDisabled}>Left 10</button>
              </div>
          </div>
          <!-- Center Section: Add, Obs Brg, Drop -->
          <div style="display: flex; flex-direction: column; align-items: center; gap: 10px;">
              <input type="text" id="add-input" value="${cumulativeAdd}" style="width: 50px; text-align: center;" placeholder="Add">
              <div class="error" id="add-error"></div>
              <div style="display: flex; flex-direction: column; gap: 10px;">
                  <button id="add-50-btn" ${calculateButtonDisabled}>Add 50</button>
                  <button id="add-10-btn" ${calculateButtonDisabled}>Add 10</button>
              </div>
              <div style="display: flex; flex-direction: column; align-items: center;">
                  <label for="obs-bearing-input">Obs Brg</label>
                  <input type="text" id="obs-bearing-input" value="${observerBearing}" style="width: 60px; text-align: center;">
              </div>
              <div style="display: flex; flex-direction: column; gap: 10px;">
                  <button id="drop-10-btn" ${calculateButtonDisabled}>Drop 10</button>
                  <button id="drop-50-btn" ${calculateButtonDisabled}>Drop 50</button>
              </div>
              <input type="text" id="drop-input" value="${cumulativeDrop}" style="width: 50px; text-align: center;" placeholder="Drop">
              <div class="error" id="drop-error"></div>
          </div>
          <!-- Right Section: Right Buttons and Input -->
          <div style="display: flex; align-items: center; gap: 10px;">
              <div style="display: flex; flex-direction: row; gap: 10px;">
                  <button id="right-10-btn" ${calculateButtonDisabled}>Right 10</button>
                  <button id="right-50-btn" ${calculateButtonDisabled}>Right 50</button>
              </div>
              <input type="text" id="right-input" value="${cumulativeRight}" style="width: 50px; text-align: center;" placeholder="Right">
              <div class="error" id="right-error"></div>
          </div>
      </div>
      <div class="calculate-button">
          <button id="calculate-adjustment-btn" ${calculateButtonDisabled}>Calculate Adjustment</button>
      </div>
  `;

  // Event listeners
  const calcAdjustBtn = document.getElementById('calculate-adjustment-btn');
  const calcSpreadBtn = document.getElementById('calculate-spread-btn');
  const add50Btn = document.getElementById('add-50-btn');
  const add10Btn = document.getElementById('add-10-btn');
  const left50Btn = document.getElementById('left-50-btn');
  const left10Btn = document.getElementById('left-10-btn');
  const right10Btn = document.getElementById('right-10-btn');
  const right50Btn = document.getElementById('right-50-btn');
  const drop10Btn = document.getElementById('drop-10-btn');
  const drop50Btn = document.getElementById('drop-50-btn');
  const obsBearingInput = document.getElementById('obs-bearing-input');
  const addInput = document.getElementById('add-input');
  const leftInput = document.getElementById('left-input');
  const rightInput = document.getElementById('right-input');
  const dropInput = document.getElementById('drop-input');

  if (mission.HasPressedCalculate) {
      calcAdjustBtn.addEventListener('click', calculate);
      calcSpreadBtn.addEventListener('click', calculateSpread);
      add50Btn.addEventListener('click', () => {
          const currentAdd = Number(addInput.value) || 0;
          addInput.value = (currentAdd + 50).toString();
          mission.adjustments = mission.adjustments || {};
          mission.adjustments.add = Number(addInput.value);
          console.log('Add 50 clicked, cumulative add:', addInput.value);
      });
      add10Btn.addEventListener('click', () => {
          const currentAdd = Number(addInput.value) || 0;
          addInput.value = (currentAdd + 10).toString();
          mission.adjustments = mission.adjustments || {};
          mission.adjustments.add = Number(addInput.value);
          console.log('Add 10 clicked, cumulative add:', addInput.value);
      });
      left50Btn.addEventListener('click', () => {
          const currentLeft = Number(leftInput.value) || 0;
          leftInput.value = (currentLeft + 50).toString();
          mission.adjustments = mission.adjustments || {};
          mission.adjustments.left = Number(leftInput.value);
          console.log('Left 50 clicked, cumulative left:', leftInput.value);
      });
      left10Btn.addEventListener('click', () => {
          const currentLeft = Number(leftInput.value) || 0;
          leftInput.value = (currentLeft + 10).toString();
          mission.adjustments = mission.adjustments || {};
          mission.adjustments.left = Number(leftInput.value);
          console.log('Left 10 clicked, cumulative left:', leftInput.value);
      });
      right10Btn.addEventListener('click', () => {
          const currentRight = Number(rightInput.value) || 0;
          rightInput.value = (currentRight + 10).toString();
          mission.adjustments = mission.adjustments || {};
          mission.adjustments.right = Number(rightInput.value);
          console.log('Right 10 clicked, cumulative right:', rightInput.value);
      });
      right50Btn.addEventListener('click', () => {
          const currentRight = Number(rightInput.value) || 0;
          rightInput.value = (currentRight + 50).toString();
          mission.adjustments = mission.adjustments || {};
          mission.adjustments.right = Number(rightInput.value);
          console.log('Right 50 clicked, cumulative right:', rightInput.value);
      });
      drop10Btn.addEventListener('click', () => {
          const currentDrop = Number(dropInput.value) || 0;
          dropInput.value = (currentDrop + 10).toString();
          mission.adjustments = mission.adjustments || {};
          mission.adjustments.drop = Number(dropInput.value);
          console.log('Drop 10 clicked, cumulative drop:', dropInput.value);
      });
      drop50Btn.addEventListener('click', () => {
          const currentDrop = Number(dropInput.value) || 0;
          dropInput.value = (currentDrop + 50).toString();
          mission.adjustments = mission.adjustments || {};
          mission.adjustments.drop = Number(dropInput.value);
          console.log('Drop 50 clicked, cumulative drop:', dropInput.value);
      });
      // Add input validation on manual input
      [addInput, dropInput, leftInput, rightInput].forEach(input => {
          input.addEventListener('input', () => {
              const value = Number(input.value);
              if (isNaN(value) || value < 0) {
                  document.getElementById(`${input.id}-error`).textContent = "Must be a positive number.";
              } else {
                  document.getElementById(`${input.id}-error`).textContent = "";
                  mission.adjustments = mission.adjustments || {};
                  mission.adjustments[input.id.split('-')[0]] = value;
              }
          });
      });
  } else {
      calcAdjustBtn.addEventListener('click', () => alert('You must calculate a solution first to adjust fire'));
      calcSpreadBtn.addEventListener('click', () => alert('You must calculate a solution first to adjust fire'));
      add50Btn.addEventListener('click', () => alert('You must calculate a solution first to adjust fire'));
      add10Btn.addEventListener('click', () => alert('You must calculate a solution first to adjust fire'));
      left50Btn.addEventListener('click', () => alert('You must calculate a solution first to adjust fire'));
      left10Btn.addEventListener('click', () => alert('You must calculate a solution first to adjust fire'));
      right10Btn.addEventListener('click', () => alert('You must calculate a solution first to adjust fire'));
      right50Btn.addEventListener('click', () => alert('You must calculate a solution first to adjust fire'));
      drop10Btn.addEventListener('click', () => alert('You must calculate a solution first to adjust fire'));
      drop50Btn.addEventListener('click', () => alert('You must calculate a solution first to adjust fire'));
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
      editButton.addEventListener('click', (event) => {
          event.stopPropagation(); // Prevent mission selection
          console.log('Edit button clicked for mission', index);
          renameMission(index);
      });
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
  if (!missionElement) {
      console.error('No input found for index', index);
      return;
  }
  missionElement.readOnly = false;
  missionElement.focus();
  const saveName = () => {
      fireMissions[index].name = missionElement.value || `Mission ${index + 1}`;
      missionElement.readOnly = true;
      displayFireMissions();
  };
  missionElement.addEventListener('blur', saveName, { once: true });
  missionElement.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') saveName();
  });
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
      <input type="text" id="target-easting" placeholder="Target Easting (5 digits)" value="${mission.TargetEasting || ''}">
      <div class="error" id="easting-error"></div>
      <input type="text" id="target-northing" placeholder="Target Northing (5 digits)" value="${mission.TargetNorthing || ''}">
      <div class="error" id="northing-error"></div>
      <input type="text" id="target-height" placeholder="Target Height (Meters)" value="${mission.TargetHeight || ''}">
      <div class="error" id="target-height-error"></div>
      <input type="text" id="observer-bearing" placeholder="Observer Bearing to Target (0-360 degrees)" value="${mission.ObserverBearing || ''}">
      <div class="error" id="bearing-error"></div>
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
          console.log("Launcher:", launcherEasting, launcherNorthing);
          console.log("Target:", paddedTargetEasting, paddedTargetNorthing);
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
      const targetEasting = document.getElementById('target-easting');
      const targetNorthing = document.getElementById('target-northing');
      const targetHeight = document.getElementById('target-height');
      const observerBearing = document.getElementById('observer-bearing');
  
      const paddedTargetEasting = padToFiveDigits(targetEasting.value);
      const paddedTargetNorthing = padToFiveDigits(targetNorthing.value);
  
      let valid = true;
  
      // Validate target easting
      if (paddedTargetEasting.length !== 5 || isNaN(paddedTargetEasting)) {
          document.getElementById('easting-error').textContent = "Must be a 5-digit number.";
          valid = false;
      } else {
          document.getElementById('easting-error').textContent = "";
          targetEasting.value = paddedTargetEasting;
      }
  
      // Validate target northing
      if (paddedTargetNorthing.length !== 5 || isNaN(paddedTargetNorthing)) {
          document.getElementById('northing-error').textContent = "Must be a 5-digit number.";
          valid = false;
      } else {
          document.getElementById('northing-error').textContent = "";
          targetNorthing.value = paddedTargetNorthing;
      }
  
      // Validate target height
      if (isNaN(targetHeight.value) || targetHeight.value === '') {
          document.getElementById('target-height-error').textContent = "Must be a valid number.";
          valid = false;
      } else {
          document.getElementById('target-height-error').textContent = "";
      }
  
      // Validate observer bearing
      if (isNaN(observerBearing.value) || observerBearing.value < 0 || observerBearing.value > 360) {
          document.getElementById('bearing-error').textContent = "Must be between 0 and 360.";
          valid = false;
      } else {
          document.getElementById('bearing-error').textContent = "";
      }
  
      if (valid) {
          const mission = fireMissions[selectedMissionIndex];
          mission.TargetEasting = paddedTargetEasting;
          mission.TargetNorthing = paddedTargetNorthing;
          mission.TargetHeight = targetHeight.value;
          mission.ObserverBearing = observerBearing.value;
          console.log("Calculating firing solutions for With Forward Observer");
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
  } else if (activeTab.includes('Adjust Fire')) {
      console.log("Processing Adjust Fire");

      // Get observer's bearing (defaults to 0 if not set)
      const observerBearing = Number(document.getElementById('obs-bearing-input').value) || 0;
      console.log("Observer bearing:", observerBearing);

      let valid = true;

      // **Polar Adjustment**
      const adjustBearingInput = document.getElementById('fire-adjustment-bearing').value;
      const adjustRangeInput = document.getElementById('fire-adjustment-distance').value;
      let polarBearing = Number(adjustBearingInput) || 0;
      let polarDistance = Number(adjustRangeInput) || 0;

      if (adjustBearingInput && (isNaN(polarBearing) || polarBearing < 0 || polarBearing > 360)) {
          document.getElementById('adjustment-bearing-error').textContent = "Must be 0-360 degrees.";
          valid = false;
      } else {
          document.getElementById('adjustment-bearing-error').textContent = "";
      }

      if (adjustRangeInput && (isNaN(polarDistance) || polarDistance < 0)) {
          document.getElementById('adjustment-range-error').textContent = "Must be a positive number.";
          valid = false;
      } else {
          document.getElementById('adjustment-range-error').textContent = "";
      }

      // **Observer Adjustment**
      const addAdjustment = Number(document.getElementById('add-input').value) || 0;
      const dropAdjustment = Number(document.getElementById('drop-input').value) || 0;
      const leftAdjustment = Number(document.getElementById('left-input').value) || 0;
      const rightAdjustment = Number(document.getElementById('right-input').value) || 0;
      console.log("Adjustments:", addAdjustment, dropAdjustment, leftAdjustment, rightAdjustment);

      if (isNaN(addAdjustment) || addAdjustment < 0) {
          document.getElementById('add-error').textContent = "Must be a positive number.";
          valid = false;
      } else {
          document.getElementById('add-error').textContent = "";
      }

      if (isNaN(dropAdjustment) || dropAdjustment < 0) {
          document.getElementById('drop-error').textContent = "Must be a positive number.";
          valid = false;
      } else {
          document.getElementById('drop-error').textContent = "";
      }

      if (isNaN(leftAdjustment) || leftAdjustment < 0) {
          document.getElementById('left-error').textContent = "Must be a positive number.";
          valid = false;
      } else {
          document.getElementById('left-error').textContent = "";
      }

      if (isNaN(rightAdjustment) || rightAdjustment < 0) {
          document.getElementById('right-error').textContent = "Must be a positive number.";
          valid = false;
      } else {
          document.getElementById('right-error').textContent = "";
      }

      if (!valid) return;

      // Current target coordinates
      let currentEasting = Number(mission.TargetEasting) || 0;
      let currentNorthing = Number(mission.TargetNorthing) || 0;

      // **Apply Polar Adjustment**
      if (polarDistance > 0) {
          const polarBearingRad = polarBearing * (Math.PI / 180);
          const polarDeltaEasting = polarDistance * Math.sin(polarBearingRad);
          const polarDeltaNorthing = polarDistance * Math.cos(polarBearingRad);
          currentEasting += polarDeltaEasting;
          currentNorthing += polarDeltaNorthing;
      }

      // **Apply Observer Adjustment**
      const netRangeAdjustment = addAdjustment - dropAdjustment;
      const netLateralAdjustment = rightAdjustment - leftAdjustment;
      if (netRangeAdjustment !== 0 || netLateralAdjustment !== 0) {
          const observerBearingRad = observerBearing * (Math.PI / 180);

          // Range adjustment (along observer's bearing)
          const rangeDeltaEasting = netRangeAdjustment * Math.sin(observerBearingRad);
          const rangeDeltaNorthing = netRangeAdjustment * Math.cos(observerBearingRad);

          // Lateral adjustment (perpendicular to observer's bearing)
          const lateralBearingRad = observerBearingRad + Math.PI / 2; // Right is positive
          const lateralDeltaEasting = netLateralAdjustment * Math.sin(lateralBearingRad);
          const lateralDeltaNorthing = netLateralAdjustment * Math.cos(lateralBearingRad);

          currentEasting += rangeDeltaEasting + lateralDeltaEasting;
          currentNorthing += rangeDeltaNorthing + lateralDeltaNorthing;
      }

      // Update mission with new target coordinates
      mission.TargetEasting = currentEasting.toFixed(0);
      mission.TargetNorthing = currentNorthing.toFixed(0);

      // Recalculate firing solutions
      mission.firingSolutions = main(
          launcherEasting,
          launcherNorthing,
          launcherHeight,
          Number(mission.TargetEasting),
          Number(mission.TargetNorthing),
          Number(mission.TargetHeight || 0),
          gunParamsCurrent.mass,
          gunParamsCurrent.drag,
          gunParamsCurrent.velocity
      );

      // Update UI
      updateAdjustFireButton();
      displayFiringSolution();
      showAdjustFire(); // Refresh UI with new coordinates
      document.getElementById('add-input').value = '0';
      document.getElementById('drop-input').value = '0';
      document.getElementById('left-input').value = '0';
      document.getElementById('right-input').value = '0';
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
  let bearingMils = Math.round((solution.bearingDeg || 0) * (6400 / 360));
  let indirectMils = Math.round(solution.milsIndirect || 0);
  let directMils = Math.round(solution.milsDirect || 0);
  document.querySelector('.firing-solution').innerHTML = `
    <div>Range: ${solution.horizontalDistance?.toFixed(2) || '00'} meters<br>Bearing: ${bearingMils || '0'} Mils</div>
    <div class="vertical-line"></div>
    <div>Indirect Elevation: ${indirectMils || '0'} Mils<br>TOF: ${solution.tofIndirect || '00.00'} seconds</div>
    <div class="vertical-line"></div>
    <div>Direct Elevation: ${directMils || '0'} Mils<br>TOF: ${solution.tofDirect || '00.00'} seconds</div>
  `; // Added closing backtick and semicolon
} // Added closing brace

// Attach all functions to window AFTER they are defined
window.start = start;
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