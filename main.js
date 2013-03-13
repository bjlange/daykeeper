Parse.initialize("Ma2oFlJurgeYxRRkoBVga7MfMLGgOlpHxARED2VR", "j3CjT3KB4G9gdWYemaPi1fiIjVbwXxGvArhs53kC"); 
var Task = Parse.Object.extend("TasksObject");
var Todos;

// Array Remove - By John Resig (MIT Licensed)
Array.prototype.remove = function(from, to) {
  var rest = this.slice((to || from) + 1 || this.length);
  this.length = from < 0 ? this.length + from : from;
  return this.push.apply(this, rest);
};

function initialize() {
    // attach a listener for push transitions, and run necessary render functions
    window.addEventListener('push', masterRender);
    window.addEventListener('popstate', masterRender);
    masterRender();
}
//On page load, run initialize
window.onload = initialize;

//Additional functions
function masterRender() {
    var page = window.location.pathname.replace('/','');
    var render_map={'agenda.html':renderAgenda,
		    'unscheduled.html':renderUnscheduledList,
		    'limbo.html':renderLimbo,
		    'detailview.html':renderDetailView};

    render_map[page]();
}

function renderAgenda() {
    console.log('hullo');
}

function renderLimbo() {
    
    var now = new Date()
    console.log(now);
    var query = new Parse.Query(Task);
    
    query.lessThan("date",now);
    query.equalTo("completed", false);
    query.find({
	success : function(results) {
	    Todos = results;
	    
	    // remove "ongoing" tasks- check the durations
	    for(var j=0; j<Todos.length; j++) {
		var dur = Todos[j].get("duration");
		var endtime = new Date(Todos[j].get("date").getTime() 
				       + dur*60000);
		if(endtime > now) {
		    //console.log('Still working on', Todos[j].get('Title'));
		    Todos.remove(j);
		}
		
	    }
	    
	    var ul = document.getElementById("limboList");
	    
	    // clear out the list
	    ul.innerHTML = "";

	    // load all tasks
	    for(var i=0; i<Todos.length; i++) {
		var title = Todos[i].get("Title");
		var li = document.createElement('li');
		var cb = document.createElement('input');
		cb.setAttribute("type","checkbox");
		var a = document.createElement('a');
		var span = document.createElement('span');
		span.setAttribute("class", "chevron");
		a.href = "detailview.html?objectId=" + Todos[i].id;
		a.title = title
		a.setAttribute("data-transition", "slide-in");
		a.setAttribute("style","display:inline;");
		a.appendChild(document.createTextNode(title));
		li.appendChild(cb);
		li.appendChild(a);
		li.appendChild(span);
		ul.appendChild(li);
		
		//.innerHTML = "<li><input type=\"checkbox\" /> <a href=\"task_detail.html\* data-transition=\"slide-in\" style=\"display:inline;\">"+title+"</a><span class=\"chevron\"></li>";
	    }
	},
	error : function(error) {
	    alert("ERROR!");
	}
    });
}

function renderDetailView() {
    var id = getParameterByName("objectId");
    var query = new Parse.Query(Task);
    query.get(id, {    
	success : function(results) {
	    var t = results;
	    var startTime = document.getElementById("startTime");
	    var taskName = document.getElementById("taskName");
	    var duration = document.getElementById("duration");
	    var mLocation = document.getElementById("location");
	    var notes = document.getElementById("notes");
	    taskName.value = t.get("Title");
	    var d = t.get("date");
	    if (d != undefined){
		startTime.value = d.toISOString();
	    }
	    duration.value = t.get("duration");
	    var locVal = t.get("location");
	    if(locVal != undefined){
	        mLocation.value = t.get("location");
	    }
	    var noteVal = t.get("notes");
	    if(noteVal != undefined){
		notes.value = t.get("notes");
	    }
	},
	error : function(error) {
	    alert("ERROR! "+error.message);
	}
    });
}
function saveClick(){
    var id = getParameterByName("objectId");
    var query = new Parse.Query(Task);
    query.get(id, {    
	success : function(results) {
	    task = results
	    var startTime = document.getElementById("startTime");
	    var taskName = document.getElementById("taskName");
	    var duration = document.getElementById("duration");
	    var mLocation = document.getElementById("location");
	    var notes = document.getElementById("notes");
	    task.set("Title", taskName.value);
	    if(startTime.value){
		task.set("date", new Date(startTime.value)); 
	    }
	    task.set("duration", parseInt(duration.value)); 
	    task.set("notes", notes.value); 
	    task.set("location", mLocation.value); 
	    task.save(null, {
		success : function(task) {
		    history.back()
		},
		error : function(error) {
		    alert("Error saving!! "+error.message);
		}
	    });
	    },
	error: function(error){
	    alert("error finding!:"+error.message);
	}
    });
}

function renderUnscheduledList() {
    var query = new Parse.Query(Task);
    
    query.descending("createdAt");
    query.doesNotExist("date");
    query.equalTo("completed", false);
    query.find({
	success : function(results) {
	    Todos = results;
	    var ul = document.getElementById("taskList");

	    // clear out the list
	    ul.innerHTML = "";

	    // load all tasks
	    for(var i=0; i<Todos.length; i++) {
		var title = Todos[i].get("Title");
		var li = document.createElement('li');
		var cb = document.createElement('input');
		cb.setAttribute("type","checkbox");
		var a = document.createElement('a');
		var span = document.createElement('span');
		span.setAttribute("class", "chevron");
		a.href = "detailview.html?objectId="+Todos[i].id;
		a.title = title
		a.setAttribute("data-transition", "slide-in");
		a.setAttribute("style","display:inline;");
		a.appendChild(document.createTextNode(title));
		li.appendChild(cb);
		li.appendChild(a);
		li.appendChild(span);
		ul.appendChild(li);
		
		//.innerHTML = "<li><input type=\"checkbox\" /> <a href=\"task_detail.html\* data-transition=\"slide-in\" style=\"display:inline;\">"+title+"</a><span class=\"chevron\"></li>";
	    }
	},
	error : function(error) {
	    alert("ERROR!");
	}
    });
    
}

function getParameterByName(name){
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regexS = "[\\?&]" + name + "=([^&#]*)";
    var regex = new RegExp(regexS);
    var results = regex.exec(window.location.search);
    if(results == null)
	return "";
    else
	return decodeURIComponent(results[1].replace(/\+/g, " "));
}
