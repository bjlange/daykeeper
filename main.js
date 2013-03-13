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
    var now = new Date()
    var query = new Parse.Query(Task);

    //set moment settings for relative day
    moment.lang('en', {
	calendar : {
            lastDay : '[Yesterday]',
            sameDay : '[Today]',
            nextDay : '[Tomorrow]',
            lastWeek : '[last] dddd',
            nextWeek : 'dddd',
            sameElse : 'L'
	}
    });
    
    query.greaterThan("date",now);
    query.equalTo("completed", false);
    query.exists("date");
    query.ascending("date");
    query.find({
	success : function(results) {
	    Todos = results;
	    	    	    
	    var ul = document.getElementById("agendaList");
	    
	    // clear out the list
	    ul.innerHTML = "";

	
	    var li = document.createElement('li');
	    li.setAttribute("class","list-divider");
	    li.appendChild(document.createTextNode("Today"));
	    ul.appendChild(li);
	    var calcheck = "Today";
    
	    // load all scheduled tasks
	    for(var i=0; i<Todos.length; i++) {
		// using moment.js to do date formatting
		var date = moment(Todos[i].get("date"));

		// check to see if we need to add a new header		
		if(date.calendar() != calcheck) {
		    var li = document.createElement('li');
		    li.setAttribute("class","list-divider");
		    li.appendChild(document.createTextNode(date.calendar()));
		    ul.appendChild(li);
		    var calcheck = date.calendar();
		}
		
		// var hours = Todos[i].get("date").getHours();
		// var mins = ("0" + Todos[i].get("date").getMinutes()).slice(-2);
		var title = date.format("h:mm a - ") + Todos[i].get("Title");

		
		
		var li = document.createElement('li');
		var a = document.createElement('a');
		var span = document.createElement('span');
		a.href = "detailview.html?objectId=" + Todos[i].id;
		a.title = title;
		a.setAttribute("data-transition", "slide-in");
		a.setAttribute("style","display:inline;");
		a.appendChild(document.createTextNode(title));
		li.appendChild(a);
		ul.appendChild(li);
		
		//.innerHTML = "<li><input type=\"checkbox\" /> <a href=\"task_detail.html\* data-transition=\"slide-in\" style=\"display:inline;\">"+title+"</a><span class=\"chevron\"></li>";
	    }
	},
	error : function(error) {
	    alert("ERROR!");
	}
    });

}

function renderLimbo() {
    var now = new Date()
    var query = new Parse.Query(Task);
    
    query.lessThan("date",now);
    query.equalTo("completed", false);
    query.equalTo("appointment", false);
    query.find({
	success : function(results) {
	    Todos = results;
	    
	    // remove "ongoing" tasks- check the durations
	    for(var j=0; j<Todos.length; j++) {
		var endtime = getEndTime(Todos[j]);
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
		cb.setAttribute("data-id",Todos[i].id);
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
	    startTime.value = t.get("date").toISOString();
	    duration.value = t.get("duration");
	    mLocation.value = t.get("location");
	    notes.value = t.get("notes");
	},
	error : function(error) {
	    alert("ERROR! "+error.message);
	}
    });
}

function renderUnscheduledList() {
    var query = new Parse.Query(Task);
    
    query.descending("createdAt");
    query.doesNotExist("date");
    query.equalTo("completed", false);
    query.equalTo("appointment", false);
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
		cb.setAttribute("data-id",Todos[i].id);
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
		
		cb.addEventListener('change',completeTask);
		
		//.innerHTML = "<li><input type=\"checkbox\" /> <a href=\"task_detail.html\* data-transition=\"slide-in\" style=\"display:inline;\">"+title+"</a><span class=\"chevron\"></li>";
	    }
	},
	error : function(error) {
	    alert("ERROR!");
	}
    });
    
}

function completeTask(){
    var id = this.getAttribute("data-id");
    
    var query = new Parse.Query(Task);
    query.get(id, {    
	success : function(task) {
	    task.set("completed",true);
	    task.save(	
		{success : function(task) {
		    history.go(0);
		},
		 error : function(error) {
		     alert("ERROR! "+error.message);
		 }
		});

	},
	error : function(error) {
	    alert("ERROR! "+error.message);
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

function getEndTime(todo){
    // Takes a Parse todo object with a start time and duration and
    // returns the end time as a JS Date object
    var dur = todo.get("duration");
    var endtime = new Date(todo.get("date").getTime() + dur*60000);
    
    return endtime;
}
