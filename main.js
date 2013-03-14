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
    // window.addEventListener('push', function () {console.log("push event", window.location.pathname);});
    // window.addEventListener('popstate', function () {console.log("popstate event", window.location.pathname);});
    // masterRender();
    window.addEventListener('push', masterRender);
    window.addEventListener('popstate', masterRender);
}
//On page load, run initialize
window.onload = initialize;

//Additional functions
function masterRender() {
    var page = window.location.pathname.replace('/','');
    var render_map={'agenda.html':renderAgenda,
		    'unscheduled.html':renderUnscheduledList,
		    'limbo.html':renderLimbo,
		    'detailview.html':renderDetailView,
		    'scheduler.html':renderSchedView};
    render_map[page]();
}
function renderSchedView(){
    //could potentially get real times here. I'll just make up time here for now
    var fDate1 = moment([2013, 2, 15, 10, 0, 0, 0]);
    var fd1End = moment([2013, 2, 15, 12, 0, 0, 0]);
    var fDate2 = moment([2013, 2, 15, 14, 30, 0, 0]);
    var fd2End = moment([2013, 2, 15, 15, 0, 0, 0]) ;
    var ft1 = document.getElementById("freetimespan1");
    var ft2 = document.getElementById("freetimespan2");
    removeChildren(ft1);
    removeChildren(ft2);
    
    
    var t1spanstr = fDate1.format("h:mm a - ")+fd1End.format("h:mm a");
    console.log(t1spanstr);
    ft1.appendChild(document.createTextNode(t1spanstr));
    var t2spanstr = fDate2.format("h:mm a - ")+fd2End.format("h:mm a");
    console.log(t2spanstr);
    ft2.appendChild(document.createTextNode(t2spanstr));
    var fta1 = document.getElementById("fta1");
    var fta2 = document.getElementById("fta2");
    fta1.setAttribute("data-timeS", fDate1.format());
    fta1.setAttribute("data-timeE", fd1End.format());
    fta2.setAttribute("data-timeS", fDate2.format());
    fta2.setAttribute("data-timeE", fd2End.format());
}

function removeChildren(myNode){
    while (myNode.firstChild) {
	myNode.removeChild(myNode.firstChild);
    }
}

function renderAgenda() {
    // limbo badge code
    var now = new Date()
    var limbo = document.getElementById('limboNum');
    var query = new Parse.Query(Task);
    query.lessThan("date",now);
    query.equalTo("completed", false);
    query.equalTo("appointment", false);
    query.count({
	success: function(count) {
	    limbo.innerHTML=count;
	},
	error: function() {
	    limbo.innerHTML="?";
	}
    });    
    
    // end limbo badge code


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

		cb.addEventListener('change',completeTask);
		
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
	    var scheduler = document.getElementById("schedulerlink");
	    scheduler.setAttribute("href", "scheduler.html?objectId="+id);
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
    // limbo badge code
    var now = new Date()
    var limbo = document.getElementById('limboNum');
    var query = new Parse.Query(Task);
    query.lessThan("date",now);
    query.equalTo("completed", false);
    query.equalTo("appointment", false);
    query.count({
	success: function(count) {
	    limbo.innerHTML=count;
	},
	error: function() {
	    limbo.innerHTML="?";
	}
    });    
    
    // end limbo badge code


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

function press(e) {
    var evt = e || window.event;


    if(evt.keyCode == 13){
	console.log('enter key');    

	var title = document.getElementById("quickadd").value;
	
	var task = new Task();
	task.set("Title", title);
	task.set("completed", false);
	task.set("appointment", false);
	
	task.save(null, {
	    success : function(task) {
		//alert("Task added! :)");
		renderUnscheduledList();
		document.getElementById("quickadd").value ="";
		
	    },
	    error : function(error) {
		alert("ERROR!!");
	    }
	});
    }
}

function onFreeTimeClick(e){
    console.log(e);
    var timestart = moment(e.getAttribute("data-timeS"));
    var timeend = moment(e.getAttribute("data-timeE"));
    var duration = timeend.diff(timestart, 'minutes');
    var id = getParameterByName("objectId");
    var datestart = new Date(timestart.format());
    var query = new Parse.Query(Task);
    console.log(timestart);
    console.log(duration);
    console.log(history);
    query.get(id, {
	success : function(task){
	    console.log("got "+id+" successful. task:"+task);
	    var savedate = new Date(timestart.format());
	    console.log("saveDate:"+savedate);
	    task.set("date", savedate);
	    task.set("duration", duration);
	    task.save(null, {
		success : function(task) {
		    console.log("save success");
		    console.log(history.length);
		    //history.go(4);
		    history.go(-2);
		},
		error : function(error) {
		    alert("Error saving!! "+error.message);
		}});
	}, error: function(error){
	    alert("error getting id:"+id+" error.message:"+error.message);
	}});
    return true
}
