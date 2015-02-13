var display_notification = (function(){
	var props = {
		self: this,
		timer: null,
		show: function(message){
			clearTimeout(self.timer);
			//$("#action_block").fadeIn(500);
			$("#action_block").text(message);
			$("#action_block").removeClass("hide_notification");
			self.timer = setTimeout(this.hide, 2000);
		},
		hide: function(){
			/*
			$("#action_block").fadeOut(500, function(){
				$("#action_block").text("");
			})*/
			$("#action_block").addClass("hide_notification");
		}
	};
	return {
		show: props.show,
		hide: props.hide
	}
})()

Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

function populate_values(){
	chrome.storage.local.get(["options", "cache", "playlist"], function(results){
		if(results.options === undefined){
			var new_options = {};
			$("#quick_looks").prop("checked", true);
			$("#features").prop("checked", true);
			$("#premium").prop("checked", true);
			new_options["quick_looks"] = true;
			new_options["features"] = true;
			new_options["unfinished"] = false;
			new_options["endurance"] = false;
			new_options["events"] = false;
			new_options["extra_life"] = false;
			new_options["encyclopedia"] = false;
			new_options["premium"] = true;
			chrome.storage.local.set({"options": new_options});
		}
		else{
			if(results.options["quick_looks"]){
				$("#quick_looks").prop("checked", true);
			}
			if(results.options["features"]){
				$("#features").prop("checked", true);
			}
			if(results.options["unfinished"]){
				$("#unfinished").prop("checked", true);
			}
			if(results.options["endurance"]){
				$("#endurance").prop("checked", true);
			}
			if(results.options["events"]){
				$("#events").prop("checked", true);
			}
			if(results.options["extra_life"]){
				$("#extra_life").prop("checked", true);
			}
			if(results.options["encyclopedia"]){
				$("#encyclopedia").prop("checked", true);
			}
			if(results.options["premium"]){
				$("#premium").prop("checked", true);
			}
		}
		if(results.cache === undefined){
			$("#cache_items").text("(No data)");
		}
		else{
			$("#cache_items").text("(" + Object.size(results.cache) + " items)");
		}
		if(results.playlist === undefined){
			$("#playlist_items").text("(No data)");
		}
		else{
			$("#playlist_items").text("(" + results.playlist.length + " items)");
		}
	});
}

function save_options(){
	var new_options = {};
	new_options["quick_looks"] = $("#quick_looks").is(":checked");
	new_options["features"] = $("#features").is(":checked");
	new_options["unfinished"] = $("#unfinished").is(":checked");
	new_options["endurance"] = $("#endurance").is(":checked");
	new_options["events"] = $("#events").is(":checked");
	new_options["extra_life"] = $("#extra_life").is(":checked");
	new_options["encyclopedia"] = $("#encyclopedia").is(":checked");
	new_options["premium"] = $("#premium").is(":checked");
	chrome.storage.local.set({"options": new_options});
	//$("#status").text("Options saved");
	display_notification.show("Options saved");
}

function default_options(){
	var options = {};
	$("#quick_looks").prop("checked", true);
	$("#features").prop("checked", true);
	$("#premium").prop("checked", true);
	options["quick_looks"] = true;
	options["features"] = true;
	options["unfinished"] = false;
	options["endurance"] = false;
	options["events"] = false;
	options["extra_life"] = false;
	options["encyclopedia"] = false;
	options["premium"] = true;
	chrome.storage.local.set({"options": options});
	//$("#status").text("Options are set to default");
	display_notification.show("Options are set to default");
}

$(document).ready(function(){
	populate_values();
	$("#save").click(save_options);
	$("#reset").click(default_options);
	$("#clear_all").click(function(){
		chrome.storage.local.clear();
		//$("#status").text("Cleared all data");
		display_notification.show("Cleared all data");
		populate_values();
	});
	$("#cache").click(function(){
		chrome.storage.local.set({"cache": {}});
		//$("#status").text("Cache cleared");
		display_notification.show("Cache cleared");
		populate_values();
	});
	$("#form_data").click(function(){
		
	});
	$("#playlist").click(function(){
		chrome.storage.local.set({"playlist": [], "current": 0});
		//$("#status").text("Playlist cleared");
		display_notification.show("Playlist cleared");
		populate_values();
	});
});