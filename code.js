//////////////////////////
// Generate random data //
//////////////////////////
function randomIntFromInterval(min, max) { // min and max included 
  return Math.floor(Math.random() * (max - min + 1) + min);
}
function GenData() {
	const nProjects = 5;
	const nHoursEntries = nProjects * 8;
	const nExpenseEntries = 3;
	const names = 
		["Babbage, Charles", "Tesla, Nikola", "Watt, James", "Ford, Henry", "Brunel, Marc Isambard"];
	const nameIds = Array.from({length: names.length}, (_, index) => index + 1);
	let projects = new Array(nProjects);
	let lines = Array();

	// Generate list of projects
	for (let i = 0; i < projects.length; i++) {
		projects[i] = { 
			id: Math.floor(Math.random()*90000) + 10000, 
			name: "Project " + (i+1),
			tasks: [{id: "1", name: "PM"}, {id: "2", name: "Design"}]
		};
	}

	// Generate expense entries
	for (let i = 0; i < nExpenseEntries; i++) {
		let project = randomIntFromInterval(0, nProjects-1);
		let task = randomIntFromInterval(0, projects[project].tasks.length-1);
		lines.push({
			"Project Number": projects[project].id,
			"Project Name": projects[project].name,
			"Task Number": projects[project].tasks[task].id,
			"Task Name": projects[project].tasks[task].name,
			"Resource Category": "ODC",
			"Quantity": randomIntFromInterval(20,200)*5
		})
	}

	// Generate hours entries
	for (let i = 0; i < nHoursEntries; i++) {
		const project = randomIntFromInterval(0, nProjects-1);
		const task = randomIntFromInterval(0, projects[project].tasks.length-1);
		const nameIndex = Math.floor(Math.random() * names.length);

		lines.push({
			"Project Number": projects[project].id,
			"Project Name": projects[project].name,
			"Task Number": projects[project].tasks[task].id,
			"Task Name": projects[project].tasks[task].name,
			"Resource Category": "Raw Labor",
			"Quantity": randomIntFromInterval(1,24),
			"Employee/Supplier Name": names[nameIndex],
			"Employee/Supplier Number": nameIds[nameIndex]
		})
	}

	return lines;
}

function findElement(arr, propName, propValue) {
  for (var i=0; i < arr.length; i++)
    if (arr[i][propName] == propValue)
      return arr[i];
  return 0; // not found
}

//////////////////////////
// Paint data to screen //
//////////////////////////
function paint(data) {
	let outE = document.getElementById('out');
	outE.innerHTML = '';
	// Find list of projects in the data
	let lookup = {};
	let projects = Array();
	for (const line of data) {
		if (!(line.hasOwnProperty("Project Name"))) { continue; }

		// check if already in list?
		if (!(line["Project Name"] in lookup)) {
			// if not, add to lookup list
			lookup[line["Project Name"]] = 1;
			projects.push( {
				id: line["Project Number"],
				name: line["Project Name"],
				tasks: Array(),
				tasks_lookup: {},
				employees: Array()
			});
		}

		// add task entry to tasks attribute
		for (let i = 0; i < projects.length; i++) {
			if (projects[i].id == line["Project Number"]) {
				// check if already in list?
				if (!(line["Task Number"] in projects[i].tasks_lookup)) {
					projects[i].tasks_lookup[line["Task Number"]] = 1;
					projects[i].tasks.push( {
						id: line["Task Number"],
						name: line["Task Name"],
						expenses: 0.0,
						labour: 0.0,
						hours: 0.0,
						employees: Array()
					});
				}

				// add this employee to the task if raw labour and not already added
				if (line["Resource Category"] == "Raw Labor") {
					let task = findElement(projects[i].tasks, 'id', line["Task Number"]);
					if (0 == findElement(task.employees, 'id', line['Employee/Supplier Number'])) {
						task.employees.push({
							id: line['Employee/Supplier Number'],
							name: line['Employee/Supplier Name'],
							hours: 0.0
						});
					}

					// also add to list for this project
					if (0 == findElement(projects[i].employees, 'id', line['Employee/Supplier Number'])) {
						projects[i].employees.push({
							id: line['Employee/Supplier Number'],
							name: line['Employee/Supplier Name'], 
							display: '' // TODO: Create a friendly version of Name
						})
					}
				}
				break;
			}
		}
	}
	
	
	// Now that data structure is created, loop through and populate hours/expenses
	for (const line of data) {
		for (let i = 0; i < projects.length; i++) {
			if (projects[i].id == line["Project Number"]) {
				for (let j = 0; j < projects[i].tasks.length; j++) {
					let task = projects[i].tasks[j];
					if (task.id == line["Task Number"]) {
						if (line["Resource Category"] == "ODC") {
							task.expenses += parseFloat(line.Quantity);
						} else if (line["Resource Category"] == "Raw Labor") {
							// First list out total hours and labour costs
							task.hours += parseFloat(line.Quantity);
							task.labour += parseFloat(line.Cost);

							// Add to individual employee's hours list for this task
							let employee = findElement(task.employees, 'id', line['Employee/Supplier Number']);
							employee.hours += parseFloat(line.Quantity);

						} else if (line["Resource Category"] == "Fringe") {
							task.labour += parseFloat(line.Cost);
						} else if (line["Resource Category"] == "Overhead") {
							task.labour += parseFloat(line.Cost);
						}
						break
					}
				}
				break;
			}
		}
	}

	// Draw the data to the page in order 
	const orderedProjects = projects.sort((a, b) => parseFloat(a.name) - parseFloat(b.name));
	for (const project of orderedProjects) {
		// get ordered list of employees for this project
		const orderedEmployees = project.employees.sort((a, b) => parseFloat(a.id) - parseFloat(b.id));

		// start of HTML table
		htmlText = `<h2>${project.name} <span class="badge badge-light">${project.id}</span></h2>
		<div class="table-responsive">
		<table class="table table-striped">
		  <thead>
		    <tr>
		      <th scope="col">Task</th>
		      <th scope="col">Expenses</th>
		      <th scope="col">Labour</th>
		      <th scope="col">Total Hours</th>`
		
		// Column headers for employees
		for (const emp of orderedEmployees) {
			htmlText += `<th class="employee" scope="col">${emp.name}</th>`
		}

		htmlText += `</tr>
		  </thead>
		  <tbody>`
	  
	  // TODO: make this sorting work with alphanumeric tasks
	  orderedTasks = project.tasks.sort((a, b) => parseFloat(a.id) - parseFloat(b.id));
	  for (const task of orderedTasks) {
	  	// build array of hours per employee
	  	let empHours = new Array(orderedEmployees.length).fill(0);
			for (let i =0; i < orderedEmployees.length; i++) {
				// get employee object for this task
				const taskEmp = findElement(task.employees, 'id', orderedEmployees[i].id)
				if (taskEmp == 0) continue;
				// save hours to the corresponding entry in the array
				empHours[i] = taskEmp.hours;
			}

	  	// build HTML for this task
	  	htmlText += `
		    <tr>
		      <td>${task.id} - ${task.name}</td>
		      <td>${task.expenses.toFixed(2) > 1e-6 ? '$'+task.expenses.toFixed(2) : ''}</td>
		      <td>${task.labour.toFixed(2) > 1e-6 ? '$'+task.labour.toFixed(2) : ''}</td>
		      <td>${task.hours.toFixed(2) > 1e-6 ? task.hours.toFixed(2) : ''}</td>`
		  for (const hours of empHours) {
		  	htmlText += `<td>${hours.toFixed(2) > 1e-6 ? hours.toFixed(2) : ''}</td>`
		  }
		  htmlText += `</tr>`
	  }
	  htmlText +=  `</tbody></table></div>`
		outE.innerHTML +=  htmlText; // send to screen
	}

}

/////////////////
// Data import //
/////////////////
function CSVToJSON(csvData) {
  var data = CSVToArray(csvData);
  var objData = [];
  for (var i = 1; i < data.length; i++) {
    objData[i - 1] = {};
    for (var k = 0; k < data[0].length && k < data[i].length; k++) {
      var key = data[0][k];
      objData[i - 1][key] = data[i][k]
    }
  }
  var jsonData = JSON.stringify(objData);
  jsonData = jsonData.replace(/},/g, "},\r\n");
  return jsonData;
}
function CSVToArray(csvData, delimiter) {
    delimiter = (delimiter || ",");
     var pattern = new RegExp((
    "(\\" + delimiter + "|\\r?\\n|\\r|^)" +
    "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +
    "([^\"\\" + delimiter + "\\r\\n]*))"), "gi");
    var data = [[]];
    var matches = null;
    while (matches = pattern.exec(csvData)) {
        var matchedDelimiter = matches[1];
        if (matchedDelimiter.length && (matchedDelimiter != delimiter)) {
            data.push([]);
        }
        if (matches[2]) {
            var matchedDelimiter = matches[2].replace(
            new RegExp("\"\"", "g"), "\"");
        } else {
            var matchedDelimiter = matches[3];
        }
        data[data.length - 1].push(matchedDelimiter);
    }
    return (data);
}


//////////////////////////
// Drag & drop handling //
//////////////////////////
const dropArea = document.getElementById('drop-zone');

dropArea.addEventListener('dragover', (event) => {
  event.stopPropagation();
  event.preventDefault();
  // Style the drag-and-drop as a "copy file" operation.
  dropArea.className = 'upload-drop-zone drop';
  event.dataTransfer.dropEffect = 'copy';
});

dropArea.addEventListener('dragleave', (event) => {
  event.stopPropagation();
  event.preventDefault();
  // Style the drag-and-drop as a "copy file" operation.
  dropArea.className = 'upload-drop-zone';
});

dropArea.addEventListener('drop', (event) => {
  event.stopPropagation();
  event.preventDefault();
  dropArea.className = 'upload-drop-zone';
  const fileList = event.dataTransfer.files;
  
  // read in first file and convert to JSON
  let file = fileList[0];
	let reader = new FileReader();
	reader.readAsText(file);
	reader.onload = function(event) {
		let csv = event.target.result;
		let jsonData = JSON.parse(CSVToJSON(csv));
		paint(jsonData);
		console.log(jsonData);
	}
  
});