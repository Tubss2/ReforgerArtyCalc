  // Import the required functions
  import { main, observerGridCalc } from './bearingrangemils.js';

  // Sample fire mission structure with added variables
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
    adjustFireRange: null, // New variable for Adjust Fire tab
    adjustFireBearing: null, // New variable for Adjust Fire tab
    HasPressedCalculate: false,
    firingSolutions: {} // Updated to object to store results
  }];

  let selectedMissionIndex = 0;

  window.onload = function () {
    setActiveTab('Without Forward Observer'); // Set default active tab on page load
  };

  window.addNewMission = function addNewMission() {
    const missionIndex = fireMissions.length;
    const newMission = {
      name: `Mission ${missionIndex + 1}`,
      TargetEasting: null,
      TargetNorthing: null,
      TargetHeight: null,
      ObserverEasting: null,
      ObserverNorthing: null,
      ObserverBearing: null,
      ObserverRangeToTgt: null,
      ObserverAltitude: null,
      adjustFireRange: null, // New variable for Adjust Fire tab
      adjustFireBearing: null, // New variable for Adjust Fire tab
      HasPressedCalculate: false,
      firingSolutions: {}
    };

    fireMissions.push(newMission);
    displayFireMissions();
  }

  window.recallMissionData = function recallMissionData() {
   const mission = fireMissions[selectedMissionIndex];

  // Create an array of input field IDs and corresponding mission properties
   const fields = [
     { id: 'target-easting', value: mission.TargetEasting },
     { id: 'target-northing', value: mission.TargetNorthing },
     { id: 'target-height', value: mission.TargetHeight },
     { id: 'observer-easting', value: mission.ObserverEasting },
     { id: 'observer-northing', value: mission.ObserverNorthing },
     { id: 'observer-bearing', value: mission.ObserverBearing },
     { id: 'observer-range', value: mission.ObserverRangeToTgt },
     { id: 'observer-altitude', value: mission.ObserverAltitude }
   ];

  // Iterate over each field and update its value if the element exists
     fields.forEach(field => {
     const inputElement = document.getElementById(field.id);
     if (inputElement) {
      inputElement.value = field.value || ''; // Use empty string if value is null or undefined
     }
    });
  }


  window.displayFireMissions = function displayFireMissions() {
    const missionsContainer = document.querySelector('.fire-missions');
    missionsContainer.innerHTML = ''; // Clear previous entries

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

  window.renameMission = function renameMission(index) {
    const missionElement = document.querySelectorAll('.mission-box input')[index];
    missionElement.readOnly = false;
    missionElement.focus();
    missionElement.addEventListener('blur', () => {
      fireMissions[index].name = missionElement.value;
      missionElement.readOnly = true;
      displayFireMissions();
    });
  }

  window.deleteMission = function deleteMission(index) {
    if (fireMissions.length > 1) {
      fireMissions.splice(index, 1);
      if (selectedMissionIndex >= index && selectedMissionIndex > 0) {
        selectedMissionIndex--;
      }
      displayFireMissions();
    } else {
      alert("You need at least one mission.");
    }
  }

  window.selectMission = function selectMission(index) {
    selectedMissionIndex = index;
    displayFireMissions();
    recallMissionData();

    updateAdjustFireButton(); // Update the Adjust Fire button state based on HasPressedCalculate
  }

window.setActiveTab = function setActiveTab(tabName) {
  // Remove 'active' class from all tabs and add 'active' class to the clicked tab based on tabName
  document.querySelectorAll('.tab').forEach(tab => {
    if (tab.textContent.includes(tabName)) {
      tab.classList.add('active');
    } else {
      tab.classList.remove('active');
    }
  });
};

window.showWithoutObserver = function showWithoutObserver() {
  setActiveTab('Without Forward Observer');
  const mission = fireMissions[selectedMissionIndex];
  const inputsContainer = document.getElementById('inputs-container');
  if (inputsContainer) {
    inputsContainer.innerHTML = `
      <input type="text" id="target-easting" placeholder="Target Easting (5 digits)" value="${mission.TargetEasting || ''}">
      <div class="error" id="easting-error"></div>
      <input type="text" id="target-northing" placeholder="Target Northing (5 digits)" value="${mission.TargetNorthing || ''}">
      <div class="error" id="northing-error"></div>
      <input type="text" id="target-height" placeholder="Target Height (Meters)" value="${mission.TargetHeight || ''}">
      <div class="error" id="target-height-error"></div>
    `;
  }
};

window.showWithObserver = function showWithObserver() {
  setActiveTab('With Forward Observer');
  const mission = fireMissions[selectedMissionIndex];
  const inputsContainer = document.getElementById('inputs-container');
  if (inputsContainer) {
    inputsContainer.innerHTML = `
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
  }
};

window.showAdjustFire = function showAdjustFire() {
  setActiveTab('Adjust Fire');
  const inputsContainer = document.getElementById('inputs-container');
  if (inputsContainer) {
    inputsContainer.innerHTML = `
      <input type="text" id="fire-adjustment-bearing" placeholder="Bearing Of Fire Adjustment (0-360 degrees)">
      <div class="error" id="adjustment-bearing-error"></div>
      <input type="text" id="fire-adjustment-distance" placeholder="Distance Of Fire Adjustment (Meters)">
      <div class="error" id="adjustment-range-error"></div>
    `;
  }
};

window.updateAdjustFireButton = function updateAdjustFireButton() {
  const mission = fireMissions[selectedMissionIndex];
  const adjustFireBtn = document.getElementById('adjust-fire-btn');

  if (adjustFireBtn) {
    if (mission.HasPressedCalculate) {
      adjustFireBtn.disabled = false;
      adjustFireBtn.classList.remove('disabled-button');
      adjustFireBtn.innerHTML = 'Adjust Fire';
      adjustFireBtn.onclick = showAdjustFire; // Use direct assignment for simplicity
    } else {
      adjustFireBtn.disabled = true;
      adjustFireBtn.classList.add('disabled-button');
      adjustFireBtn.innerHTML = 'Adjust Fire ❌';
      adjustFireBtn.onclick = () => alert('You must calculate a solution first to adjust fire');
    }
  }
};


// Ensure the function is globally accessible
  window.start = function start() {
    const launcherEasting = document.getElementById('initial-launcher-easting');
    const launcherNorthing = document.getElementById('initial-launcher-northing');
    const launcherHeight = document.getElementById('initial-launcher-height');

    let valid = true;

    // Validate launcher easting and northing inputs (5 digits)
    if (launcherEasting && launcherEasting.value.length !== 5) {
        document.getElementById('initial-easting-error').textContent = "Coordinates must be 5 digits long.";
        valid = false;
    } else if (launcherEasting) {
        document.getElementById('initial-easting-error').textContent = "";
    }

    if (launcherNorthing && launcherNorthing.value.length !== 5) {
        document.getElementById('initial-northing-error').textContent = "Coordinates must be 5 digits long.";
        valid = false;
    } else if (launcherNorthing) {
        document.getElementById('initial-northing-error').textContent = "";
    }

    // Validate launcher height input (ensure it's a number)
    if (launcherHeight && isNaN(launcherHeight.value)) {
        document.getElementById('initial-height-error').textContent = "Please enter a valid number for height.";
        valid = false;
    } else if (launcherHeight) {
        document.getElementById('initial-height-error').textContent = "";
    }

    // If valid, transition to the main interface
    if (valid) {
        document.getElementById('initial-overlay').style.display = 'none';
        document.getElementById('main-container').style.display = 'flex';

        // Set launcher grid position based on initial inputs
        document.getElementById('launcher-easting').value = launcherEasting.value;
        document.getElementById('launcher-northing').value = launcherNorthing.value;
        document.getElementById('launcher-height').value = launcherHeight.value;
    }
};

  window.calculate = function calculate() {
    const mission = fireMissions[selectedMissionIndex];

    const targetEasting = document.getElementById('target-easting');
    const targetNorthing = document.getElementById('target-northing');
    const targetHeight = document.getElementById('target-height');
    const observerEasting = document.getElementById('observer-easting');
    const observerNorthing = document.getElementById('observer-northing');
    const observerBearing = document.getElementById('observer-bearing');
    const observerRange = document.getElementById('observer-range');
    const observerAltitude = document.getElementById('observer-altitude');
    const adjustFireBearing = document.getElementById('fire-adjustment-bearing');
    const adjustFireRange = document.getElementById('fire-adjustment-distance');

    let valid = true;

    // Validate easting and northing inputs (5 digits)
    if (targetEasting && targetEasting.value.length !== 5) {
      document.getElementById('easting-error').textContent = "Coordinates must be 5 digits long.";
      valid = false;
    } else if (targetEasting) {
      document.getElementById('easting-error').textContent = "";
    }

    if (targetNorthing && targetNorthing.value.length !== 5) {
      document.getElementById('northing-error').textContent = "Coordinates must be 5 digits long.";
      valid = false;
    } else if (targetNorthing) {
      document.getElementById('northing-error').textContent = "";
    }

    if (observerEasting && observerEasting.value.length !== 5) {
      document.getElementById('observer-easting-error').textContent = "Coordinates must be 5 digits long.";
      valid = false;
    } else if (observerEasting) {
      document.getElementById('observer-easting-error').textContent = "";
    }

    if (observerNorthing && observerNorthing.value.length !== 5) {
      document.getElementById('observer-northing-error').textContent = "Coordinates must be 5 digits long.";
      valid = false;
    } else if (observerNorthing) {
      document.getElementById('observer-northing-error').textContent = "";
    }

    // Validate bearing (0-360 degrees)
    if (observerBearing && (observerBearing.value < 0 || observerBearing.value > 360)) {
      document.getElementById('bearing-error').textContent = "Please enter a value between 0 and 360 degrees.";
      valid = false;
    } else if (observerBearing) {
      document.getElementById('bearing-error').textContent = "";
    }

    // Validate adjustment bearing (0-360 degrees)
    if (adjustFireBearing && (adjustFireBearing.value < 0 || adjustFireBearing.value > 360)) {
      document.getElementById('adjustment-bearing-error').textContent = "Please enter a value between 0 and 360 degrees.";
      valid = false;
    } else if (adjustFireBearing) {
      document.getElementById('adjustment-bearing-error').textContent = "";
    }

    // Validate observer range and altitude
    if (observerRange && isNaN(observerRange.value)) {
      document.getElementById('observer-range-error').textContent = "Please enter a valid number for range.";
      valid = false;
    } else if (observerRange) {
      document.getElementById('observer-range-error').textContent = "";
    }

    if (observerAltitude && isNaN(observerAltitude.value)) {
      document.getElementById('observer-altitude-error').textContent = "Please enter a valid number for altitude.";
      valid = false;
    } else if (observerAltitude) {
      document.getElementById('observer-altitude-error').textContent = "";
    }

    if (adjustFireRange && isNaN(adjustFireRange.value)) {
      document.getElementById('adjustment-range-error').textContent = "Please enter a valid number for range.";
      valid = false;
    } else if (adjustFireRange) {
      document.getElementById('adjustment-range-error').textContent = "";
    }

    // If valid, update mission data and enable Adjust Fire button
    if (valid) {
      mission.TargetEasting = targetEasting ? targetEasting.value : null;
      mission.TargetNorthing = targetNorthing ? targetNorthing.value : null;
      mission.TargetHeight = targetHeight ? targetHeight.value : null;
      mission.ObserverEasting = observerEasting ? observerEasting.value : null;
      mission.ObserverNorthing = observerNorthing ? observerNorthing.value : null;
      mission.ObserverBearing = observerBearing ? observerBearing.value : null;
      mission.ObserverRangeToTgt = observerRange ? observerRange.value : null;
      mission.ObserverAltitude = observerAltitude ? observerAltitude.value : null;
      mission.adjustFireBearing = adjustFireBearing ? adjustFireBearing.value : null;
      mission.adjustFireRange = adjustFireRange ? adjustFireRange.value : null;

      // Sanitize data
      const saniLauncherEasting = Number(document.getElementById('launcher-easting').value);
      const saniLauncherNorthing = Number(document.getElementById('launcher-northing').value);
      const saniLauncherHeight = Number(document.getElementById('launcher-height').value);
      const saniTargetEasting = Number(targetEasting ? targetEasting.value : null);
      const saniTargetNorthing = Number(targetNorthing ? targetNorthing.value : null);
      const saniTargetHeight = Number(targetHeight ? targetHeight.value : null);
      const saniObserverEasting = Number(observerEasting ? observerEasting.value : null);
      const saniObserverNorthing = Number(observerNorthing ? observerNorthing.value : null);
      const saniObserverBearing = Number(observerBearing ? observerBearing.value : null);
      const saniObserverRangeToTgt = Number(observerRange ? observerRange.value : null);
      const saniObserverAltitude = Number(observerAltitude ? observerAltitude.value : null);
      const saniAdjustFireBearing = Number(adjustFireBearing ? adjustFireBearing.value : null);
      const saniAdjustFireRange = Number(adjustFireRange ? adjustFireRange.value : null);

      let firingSolutionResult;

      // Check which tab is active and call corresponding function
      const activeTab = document.querySelector('.tab.active');

     if (activeTab && activeTab.textContent.includes('Without Forward Observer')) {

    firingSolutionResult = main(
      saniLauncherEasting, 
      saniLauncherNorthing, 
      saniLauncherHeight, 
      saniTargetEasting, 
      saniTargetNorthing, 
      saniTargetHeight
    );
      console.log('Firing Solution Result (Without Forward Observer):', firingSolutionResult);
      mission.firingSolutions = firingSolutionResult;
  
   } else if (activeTab && activeTab.textContent.includes('With Forward Observer')) {
    const firingSolutionResult = observerGridCalc(
      saniLauncherNorthing, 
      saniLauncherEasting, 
      saniLauncherHeight, 
      saniObserverEasting, 
      saniObserverNorthing, 
      saniObserverBearing, 
      saniObserverRangeToTgt, 
      saniObserverAltitude
    );
       console.log('Firing Solution Result (With Forward Observer):', firingSolutionResult);
    mission.firingSolutions = firingSolutionResult;
    mission.TargetEasting = firingSolutionResult.updatedEastingTarget;
    mission.TargetNorthing = firingSolutionResult.updatedNorthingTarget;
  
  } else if (activeTab && activeTab.textContent.includes('Adjust Fire')) {

    const firingSolutionResult = observerGridCalc(
      saniLauncherNorthing, 
      saniLauncherEasting, 
    saniLauncherHeight, 
      saniTargetEasting, 
      saniTargetNorthing, 
      saniAdjustFireBearing, 
      saniAdjustFireRange, 
      saniTargetHeight
    );

    mission.firingSolutions = firingSolutionResult;
    mission.TargetEasting = firingSolutionResult.updatedEastingTarget;
    mission.TargetNorthing = firingSolutionResult.updatedNorthingTarget;

  } else {
    console.log("No active tab found or it doesn't match any known conditions.");
  }


      mission.HasPressedCalculate = true; // Set HasPressedCalculate to true

      displayFireMissions();
      updateAdjustFireButton(); // Call the function to update the button state

      // Display firing solution
      displayFiringSolution();
    }
  }

  window.displayFiringSolution = function displayFiringSolution() {
    const mission = fireMissions[selectedMissionIndex];
    const solution = mission.firingSolutions;
    
    document.querySelector('.firing-solution').innerHTML = `
      <div>Range: ${solution.horizontalDistance || '00'}<br> Bearing: ${solution.bearingDeg || '00.00'}</div>
      <div class="vertical-line"></div>
      <div>Indirect Mils: ${solution.milsIndirect || '00'}<br>TOF: ${solution.tofIndirect || '00.00'}</div>
      <div class="vertical-line"></div>
      <div>Direct Mils: ${solution.milsDirect || '00'}<br>TOF: ${solution.tofDirect || '00.00'}</div>
    `;
  }

  displayFireMissions();
