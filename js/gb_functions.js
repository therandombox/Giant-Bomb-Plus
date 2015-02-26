var BASE_DOMAIN = "http://www.therandombox.ca";
var VIDEO_URL = "/giantbomb/videos";
var PEOPLE_URL = "/giantbomb/people";
var PLATFORM_URL = "/giantbomb/platforms";
var TAG_URL = "/giantbomb/tags";

function get_resource(url, data, callback){
	$.ajax({
		type: "GET",
		data: data,
		url: url,
		crossDomain: false,
		success: callback
	});
}

function verify_cache(){
	// TODO: combine all storage set calls? unify storage variables?
	// Determine if cache values have expired or set to default
	var deferred = $.Deferred();
	chrome.storage.local.get(["cache_timestamp", "cache", "playlist", "current", "form_data_timestamp", "people", "platforms", "tags"], function(results){
		if(results.cache === undefined){
			results.cache = {};
			results.cache_timestamp = Date.now() / 1000;
		}
		else if(Math.round(Date.now() / 1000) - (60 * 60 * 24 * 3) > results.cache_timestamp){
			var new_list = {};
			for(var k = 0; k < results.playlist.length; k++){
				new_list[results.playlist[k]] = results.cache[results.playlist[k]];
			}
			results.cache = new_list;
			results.cache_timestamp = Date.now() / 1000;
		}
		if(results.playlist === undefined){
			results.playlist = [];
		}
		if(results.current === undefined){
			results.current = 0;
		}
		//console.log("Current: " + (Math.round(Date.now() / 1000) - (60 * 60 * 12)));
		//console.log("Saved: " + results.form_data_timestamp);
		if(results.form_data_timestamp === undefined || Math.round(Date.now() / 1000) - (60 * 60 * 12) > results.form_data_timestamp){
			results.form_data_timestamp = Date.now() / 1000;
			get_resource(BASE_DOMAIN + PEOPLE_URL, "", function(response){
				response = JSON.parse(response);
				chrome.storage.local.set({"people": response});
				get_resource(BASE_DOMAIN + PLATFORM_URL, "", function(response){
					response = JSON.parse(response);
					chrome.storage.local.set({"platforms": response});
					get_resource(BASE_DOMAIN + TAG_URL, "", function(response){
						response = JSON.parse(response);
						chrome.storage.local.set({"cache_timestamp": results.cache_timestamp, "cache": results.cache, "playlist": results.playlist,
							"current": results.current, "form_data_timestamp": results.form_data_timestamp, "tags": response});
						deferred.resolve("Cache verified");
					});
				});
			});
		}
		else{
			chrome.storage.local.set({"cache_timestamp": results.cache_timestamp, "cache": results.cache, "playlist": results.playlist,
				"current": results.current, "form_data_timestamp": results.form_data_timestamp});
			deferred.resolve("Cache verified");
		}
	});
	return deferred.promise();
}

function get_video_id_from_link(link){
	var uri = link.split('/');
	var video_id = uri[uri.length - 2].split('-');
	return video_id[1];
}

function get_people_list(){
	var data = [];
	$("#people option").each(function(){
		data.push($(this).text());
	});
	return data;
}

function time_to_seconds(time_str){
	var time_fragments = time_str.split(':');
	if(time_fragments.length === 2){
		return (+time_fragments[0] * 60) + (+time_fragments[1]);
	}
	if(time_fragments.length === 3){
		return (+time_fragments[0] * 60 * 60) + (+time_fragments[1] * 60) + (+time_fragments[2]);
	}
	return false;
}

function attach_list_events(){
	$("#people_list").on("click", "li", function(){
		$("#people option:contains(" + $(this).text() + ")").removeAttr("selected");
		$(this).remove();
		$(".person_count").text($("#people_list li").length + "/5");
		$("#person_name").val("");
	});
}

function attach_typeahead_event(){
	$("#person_name").typeahead({
		autoselect: true,
		hint: true,
		highlight: true,
		minLength: 1
	},{
		name: "people",
		displayKey: "value",
		source: substringMatcher(get_people_list())
	}).on('typeahead:selected', function (obj, datum){
		var person_count = $("#people_list li").length;
		if(person_count < 5 && $("#people_list li div:contains(" + datum.value + ")").length == 0){
			$("#people option:contains(" + datum.value + ")").attr("selected", "selected");
			$("#people_list").append(
				$("<li/>").append(
					$("<div/>", {"text": datum.value})
				).append(
					$("<i/>", {"class": "icon icon-remove pull-right"})
				)
			);
			$(".person_count").text(person_count + 1 + "/5");
			$("#person_name").val("");
			attach_list_events();
		}
	});
}

function populate_select(selector, results){
	$.each(results, function(index, element){
		selector.append($("<option/>", {"value": element.name, "text": element.name}));
	});
}

function add_option_button(){
	$("#user-bar").append(
		$("<li/>", {"id": "extension_options"}).append(
			$("<a/>", {"href": chrome.extension.getURL("options.html")}).prepend(
				$("<span/>", {"class": "icon icon-cog"})
			)
		)
	);
	$(".header-auth").append(
		$("<a/>", {"id": "extension_options", "href": chrome.extension.getURL("options.html")}).prepend(
			$("<span/>", {"class": "icon icon-cog"})
		)
	);
}

function default_settings(){
	chrome.storage.local.get("options", function(results){
		if(results.options === undefined){
			var new_options = {};
			new_options["quick_looks"] = true;
			new_options["features"] = true;
			new_options["unfinished"] = false;
			new_options["endurance"] = false;
			new_options["encyclopedia"] = false;
			new_options["premium"] = true;
			chrome.storage.local.set({"options": new_options});
			results.options = new_options;
		}
		var current_address = window.location.href;
		if(current_address.indexOf("/videos/quick-looks") !== -1){
			if(results.options["quick_looks"]) $(".sub-nav ul li:eq(1)").trigger("click");
		}
		else if(current_address.indexOf("/videos/features") !== -1){
			if(results.options["features"]) $(".sub-nav ul li:eq(1)").trigger("click");
		}
		else if(current_address.indexOf("/videos/unfinished") !== -1){
			if(results.options["unfinished"]) $(".sub-nav ul li:eq(1)").trigger("click");
		}
		else if(current_address.indexOf("/videos/endurance-run") !== -1){
			if(results.options["endurance"]) $(".sub-nav ul li:eq(1)").trigger("click");
		}
		else if(current_address.indexOf("/videos/events") !== -1){
			if(results.options["events"]) $(".sub-nav ul li:eq(1)").trigger("click");
		}
		else if(current_address.indexOf("/videos/extra-life") !== -1){
			if(results.options["extra_life"]) $(".sub-nav ul li:eq(1)").trigger("click");
		}
		else if(current_address.indexOf("/videos/encyclopedia-bombastica") !== -1){
			if(results.options["encyclopedia"]) $(".sub-nav ul li:eq(1)").trigger("click");
		}
		else if(current_address.indexOf("/videos/subscriber") !== -1){
			if(results.options["premium"]) $(".sub-nav ul li:eq(1)").trigger("click");
		}
	});
}

var substringMatcher = function(strs){
	return function findMatches(q, cb){
		var matches;

		// an array that will be populated with substring matches
		matches = [];

		// regex used to determine if a string contains the substring `q`
		substrRegex = new RegExp(q, 'i');

		// iterate through the pool of strings and for any string that
		// contains the substring `q`, add it to the `matches` array
		$.each(strs, function(i, str){
			if (substrRegex.test(str)){
				// the typeahead jQuery plugin expects suggestions to a
				// JavaScript object, refer to typeahead docs for more info
				matches.push({ value: str });
			}
		});
		cb(matches);
	};
};

var playlist_module = (function(){
	var props = {
		loop_count: 0,
		timer: null,
		init: function(){
			// Build playlist elements
			$(".av-options").append(
				$("<li/>", {"class": "av-menu-hit playlist_options"}).append(
					$("<a/>", {"text": " Playlist "}).prepend(
						$("<span/>", {"class": "icon icon-th-list"})
					).append(
						$("<span/>", {"class": "playlist_count"})
					)
				).append(
					$("<div/>", {"class": "av-menu"}).append(
						$("<a/>", {"class": "toggle_playlist", "text": "Toggle"})
					).append(
						$("<a/>", {"class": "save_playlist", "text": "Save"})
					).append(
						$("<a/>", {"class": "clear_playlist", "text": "Clear"})
					)
				)
			);
			$(".av-wrapper-max").append(
				$("<div/>", {"class": "playlist_row"}).append(
					$("<div/>", {"class": "playlist_header hide_playlist", "text": "Playlist "}).prepend(
						$("<span/>", {"class": "icon icon-th-list"})
					).append(
						$("<span/>", {"class": "playlist_count"})
					).append(
						$("<span/>", {"class": "pull-right icon icon-chevron-left"})
					)
				)
			).append(
				$("<div/>", {"class": "playlist_row"}).append(
					$("<ul/>", {"id": "playlist_container", "class": "hide_playlist"})
				)
			);
			
			// Attach event handlers
			$("#site").on("click", ".queue_btn", function(){
				var video_id = parseInt($(this).attr("data-id"));
				props.queue(video_id);
			});
			$("#site").on("click", "#filter_queue_all", function(){
				get_resource(BASE_DOMAIN + VIDEO_URL, $("#filter_options").serialize() + "&action=basic&flag=queue", props.queue_all);
			});
			$(".toggle_playlist, .playlist_header").click(function(){
				props.toggle_playlist();
			});
			$(".save_playlist").click(props.save);
			$(".clear_playlist").click(props.clear);
			$(".av-wrapper-max").on("click", "#playlist_container .playlist_item", props.select_video);
			$(".av-wrapper-max").on("click", "#playlist_container .play_item", props.play_video);
			$(".av-wrapper-max").on("click", "#playlist_container .remove_item", props.remove_video);
			$("#playlist_container").sortable();
			
			// TODO: Unify button creation function?
			// Add queue buttons
			$("#video-block ul.editorial a").each(function(){
				props.insert_queue_buttons();
				/*
				chrome.storage.local.get(["cache"], function(results){
					filter_module.build_cache(results);
				});
				var video_id = get_video_id_from_link($(this).attr("href"));
				$(this).after("<button class=\"btn btn-primary queue_btn\" data-id=\"" + video_id + "\">Queue</button>");*/
			});
			$(".sub-nav").on("click", "ul li:eq(0), #video_categories option", function(){
				props.insert_queue_buttons();
			});
			$("#video-block").on("click", ".paginate a", function(){
				props.insert_queue_buttons();
			});
			chrome.storage.local.get(["cache", "playlist", "current"], props.display);
		},
		insert_queue_buttons: function(){
			// Insert queue buttons into video pages including pagination, allow for 10 seconds loading until it fails
			props.loop_count = 0;
			//console.log("Pagination clicked");
			props.timer = setInterval(function(){
				if(props.loop_count < 10){
					if($("#video-block ul li").length > 0){
						if($("#video-block .queue_btn").length === 0){
							//console.log("content loaded");
							chrome.storage.local.get(["cache"], function(results){
								filter_module.build_cache(results);
							});
							$("#video-block ul.editorial a").each(function(){
								var video_id = get_video_id_from_link($(this).attr("href"));
								$(this).after("<button class=\"btn btn-primary btn-mini queue_btn\" data-id=\"" + video_id + "\"><i class=\"icon icon-plus\"></i> Queue</button>");
							});
							props.loop_count = 10;
							clearInterval(props.timer);
						}
					}
					else{
						props.loop_count++;
					}
				}
			}, 1000);
		},
		queue: function(id){
			chrome.storage.local.get(["cache", "playlist", "current"], function(results){
				//console.log("Current cache");
				//console.log(results.cache);
				//console.log(id);
				if(results.cache[id] !== undefined){
					if(results.playlist.length + 1 <= 200){
						results.playlist.push(id);
						chrome.storage.local.set({"playlist": results.playlist});
						//console.log("Added one video to cache");
						//console.log(results.cache);
						props.display(results);
						notification_module.show(results.cache[id].name + " was added");
					}
					else{
						notification_module.show("The playlist cannot accept the size of your request (Maximum 200 videos)");
					}
				}
				else{
					notification_module.show("No new videos were added to the playlist");
				}
			});
		},
		queue_all: function(video_data){
			// Parse server data to see if it fits
			video_data = JSON.parse(video_data);
			var new_video_count = video_data.length;
			if(new_video_count > 0){
				chrome.storage.local.get(["cache", "playlist", "current"], function(results){
					var current_list = results.playlist;
					var video_data_list = results.cache;
					if(results.playlist.length + new_video_count <= 200){
						for(var k = 0; k < new_video_count; k++){
							current_list.push(video_data[k].id);
							video_data_list[video_data[k].id] = video_data[k];
						}
						chrome.storage.local.set({"playlist": current_list});
						chrome.storage.local.set({"cache": video_data_list});
						//console.log("Added new videos to cache");
						//console.log(results.cache);
						if(new_video_count === 1)
							notification_module.show(new_video_count + " new video was added to the playlist");
						else
							notification_module.show(new_video_count + " new videos were added to the playlist");
						props.display(results);
					}
					else{
						notification_module.show("The playlist cannot accept the size of your request (Maximum 200 videos)");
					}
				});
			}
			else{
				notification_module.show("No new videos were added to the playlist");
			}
		},
		toggle_playlist: function(){
			if($(".playlist_header, #playlist_container").hasClass("hide_playlist")){
				var header_height = $(".playlist_header").outerHeight();
				var video_container_height = $(".av-wrapper-max").outerHeight();
				//console.log("header | container " + header_height + " | " + video_container_height);
				$(".playlist_header, #playlist_container").removeClass("hide_playlist");
				if($("#playlist_container li").length > 0){
					$("#playlist_container").height(video_container_height - header_height);
					var first_pos = $("#playlist_container li:first").offset().top;
					var current_pos = $("#playlist_container li.playing").offset().top;
					$("#playlist_container").animate({scrollTop: current_pos - first_pos}, 1000);
				}
			}
			else{
				$(".playlist_header, #playlist_container").addClass("hide_playlist");
			}
		},
		display: function(results){
			$("#playlist_container").empty();
			//console.log(results.playlist);
			if(results.playlist !== undefined && results.cache !== undefined){
				if(results.playlist.length > 0 && Object.size(results.cache) > 0){
					for(var k = 0; k < results.playlist.length; k++){
						$("#playlist_container").append(
								$("<li/>", {"data-id": results.cache[results.playlist[k]].id, "data-url": results.cache[results.playlist[k]].video_url}
							).append(
								$("<span/>", {"class": "index", "text": k + 1})
							).append(
								$("<span/>", {"class": "icon icon-play play_item"})
							).append(
								$("<div/>", {"class": "playlist_item", "text": results.cache[results.playlist[k]].name})
							).append(
								$("<span/>", {"class": "icon icon-remove remove_item"})
							)
						);
					}
					$("#playlist_container li:eq(" + results.current + ")").addClass("playing");
				}
				props.update_count(results.playlist);
			}
		},
		update_count: function(playlist){
			if(playlist === undefined || playlist === 0){
				$(".playlist_count").text("(" + 0 + ")");
			}
			else{
				$(".playlist_count").text("(" + playlist.length + ")");
			}
		},
		play_video: function(){
			var url = $(this).closest("li").attr("data-url");
			chrome.storage.local.set({"current": $(this).closest("li").index()}, function(){
				window.location.href = url;
			});
		},
		select_video: function(){
			$("#playlist_container li.playing").each(function(){
				if($(this).hasClass("playing")){
					$(this).removeClass("playing");
				}
			});
			$(this).closest("li").addClass("playing");
			chrome.storage.local.set({"current": $(this).closest("li").index()});
		},
		remove_video: function(){
			var selected_element = $(this).closest("li");
			var selected_index = selected_element.index();
			//var id = selected_element.attr("data-id");
			//console.log("Removing " + id);
			chrome.storage.local.get(["playlist", "current"], function(results){
				var current_index = results.current;
				results.playlist.splice(selected_index, 1);
				chrome.storage.local.set({"playlist": results.playlist});
				props.update_count(results.playlist);
				if(results.playlist.length > results.current){
					chrome.storage.local.set({"current": results.playlist.length});
				}
				$(".playlist_item:eq(" + (current_index) + ")").trigger("click");
				$("#playlist_container .index").each(function(index){
					$(this).text(index + 1);
				});
			});
			selected_element.remove();
		},
		clear: function(){
			chrome.storage.local.set({"video_data": {}, "playlist": [], "current": 0});
			chrome.storage.local.get(["cache", "playlist", "current"], props.display);
			notification_module.show("Playlist was cleared");
		},
		save: function(){
			var list = [];
			$("#playlist_container li").each(function(){
				list.push(parseInt($(this).attr("data-id")));
			});
			chrome.storage.local.set({"playlist": list});
			chrome.storage.local.get(["cache", "playlist", "current"], props.display);
			notification_module.show("New order of the playlist was saved");
		}
	};
	return {
		init: props.init
	}
})()

var filter_module = (function(){
	var props = {
		init: function(){
			// Build filter form and display elements
			// TODO: combine get_form_data with get .html?
			$.get(chrome.extension.getURL("/filter_options.html"), function(data){
				$(".sub-nav ul li:eq(0)").after(
					$("<li/>").append(
						$("<a/>", {"data-toggle": "tab", "text": "Filter "}).prepend(
							$("<i/>", {"class": "icon icon-filter"})
						).append(
							$("<span/>", {"class": "person_count", "text": "0/5"})
						)
					)
				);
				$("#site").prepend($.parseHTML(data));
				$("#video-block").after(
					$("<div/>", {"id": "loading_block", "class": "text-center"}).append(
						$("<span/>", {"class": "icon icon-spinner"})),
					$("<div/>", {"id": "filter_block", "class": "tab-pane"})
				);
				
				// Attach form events handlers
				$("#site").on("submit", "#filter_options", function(event){
					event.preventDefault();
					$("#filter_block").fadeOut(250, function(){
						$("#loading_block").addClass("active");
						get_resource(BASE_DOMAIN + VIDEO_URL, $("#filter_options").serialize() + "&action=basic", props.display_videos);
					});
				});
				$("#site").on("click", "#filter_random", function(event){
					$("#filter_block").fadeOut(250, function(){
						$("#loading_block").addClass("active");
						get_resource(BASE_DOMAIN + VIDEO_URL, $("#filter_options").serialize() + "&action=random", props.random_video);
					});
				});
				$("#filter_reset").click(function(){
					$("input").each(function(){
						$(this).val("");
					});
					$("#people_list li").each(function(){
						$(this).trigger("click");
					});
					$(".person_count").text("0/5");
					$("#platform").val($("#platform option:first").val());
					$("#tag").val($("#tag option:first").val());
					$("#sort").val($("#sort option:first").val());
				});
				$("#site").on("click", ".paginate a", props.select_page);
				$("#filter_pin").click(function(){
					if($(this).hasClass("selected")){
						$(this).removeClass("selected");
						$("#filter_block").css("margin-top", "");
						$("#filter_options").removeClass("pinned");
					}
					else{
						$(this).addClass("selected");
					}
				});
				
				// Find form data and populate
				chrome.storage.local.get(["people", "platforms", "tags"], function(results){
					$("#platform").append($("<option/>", {"value": "Any", "text": "Any Platform"}));
					$("#tag").append($("<option/>", {"value": "Any", "text": "Any Tag"}));
					populate_select($("#people"), results.people);
					populate_select($("#platform"), results.platforms);
					populate_select($("#tag"), results.tags);
					attach_typeahead_event();
				});
				
				// Add tab events
				$(".sub-nav ul li:eq(0), .sub-nav ul li:eq(2)").click(function(){
					props.select_tab(0)
				});
				$(".sub-nav ul li:eq(1)").click(function(){
					props.select_tab(1)
				});
				
				// Sticky filter form
				$(window).scroll(function(){
					if($("#filter_pin").hasClass("selected")){
						var window_top = $(window).scrollTop();
						var div_top = $("#site").offset().top;
						if(window_top > div_top){
							$("#filter_block").css("margin-top", $("#filter_options").height() + "px");
							$("#filter_options").addClass("pinned");
						}
						else{
							$("#filter_block").css("margin-top", "");
							$("#filter_options").removeClass("pinned");
						}
					}
				});
			});
		},
		build_cache: function(results){
			// Store data of any videos that is seen by the user
			$("#filter_block .editorial li, #video-block .editorial li").each(function(){
				var new_obj = {};
				new_obj.name = $(this).find("h3").text();
				var url = $(this).find("a").attr("href");
				if(url.indexOf("http://www.giantbomb.com") > -1)
					new_obj.video_url = url;
				else
					new_obj.video_url = "http://www.giantbomb.com" + url;
				new_obj.id = get_video_id_from_link(url);
				results.cache[new_obj.id] = new_obj;
				//console.log(new_obj);
			});
			chrome.storage.local.set({"cache": results.cache});
		},
		select_tab: function(index){
			//console.log("Selecting " + index);
			if(index === 0){
				if($("#filter_block").hasClass("active")){
					$("#filter_block").removeClass("active").removeAttr("style");
					$("#filter_options").addClass("hide");
				}
			}
			if(index === 1){
				// Update sub-nav classes
				if(!$(".sub-nav ul li:eq(1)").hasClass("active")){
					$(".sub-nav ul li:eq(1)").addClass("active");
				}
				var other_tabs = $(".sub-nav ul li:eq(0), .sub-nav ul li:eq(2)");
				if(other_tabs.hasClass("active")){
					other_tabs.removeClass("active");
				}
				// Update content pane classes
				if(!$("#filter_block").hasClass("active")){
					$("#filter_block").addClass("active");
					$("#filter_options").removeClass("hide");
				}
				var other_panes = $("div.tab-pane").not($("#filter_block"));
				if(other_panes.hasClass("active")){
					other_panes.removeClass("active");
				}
				if(!$(".secondary-content").hasClass("hide")){
					$(".secondary-content").addClass("hide");
					if($(".primary-content").hasClass("span8")){
						$(".primary-content").addClass("span12").removeClass("span8");
					}
				}
				if($("#filter_block").children().length < 1){
					$("#filter_block").fadeOut(250, function(){
						$("#loading_block").addClass("active");
						get_resource(BASE_DOMAIN + VIDEO_URL, "", props.display_videos);
					});
				}
			}
		},
		select_page: function(event){
			event.preventDefault();
			var url_fragment = $(this).attr("data-id");
			if(url_fragment !== undefined){
				$("#filter_block").fadeOut(250, function(){
					$("#loading_block").addClass("active");
					$(document).scrollTop($(".sub-nav").offset().top);
					get_resource(BASE_DOMAIN + url_fragment, "", props.display_videos);
				});
			}
		},
		display_videos: function(response){
			// TODO: Partial merge with random_video, get_resource and ui transition?
			//$("#filter_block").fadeOut(500, function(){
			$("#loading_block").removeClass("active");
			if(response){
				$("#filter_block").empty().append(response).fadeIn(500);
				chrome.storage.local.get(["cache"], function(results){
					props.build_cache(results);
				});
				if($(".paginate").length > 0){
					//$(".pagination").addClass("paginate");
					$(".pagination").parent().closest("div").removeAttr("class"); // remove?
					$(".paginate li.active").addClass("on");
				}
				$(".paginate a").each(function(){
					$(this).attr("class", "btn");
					$(this).attr("data-id", $(this).attr("href"));
					$(this).attr("href", "javascript:void(0)");
					$(this).removeAttr("data-ci-pagination-page");
					if($(this).find(".fa-arrow-left").length !== 0){
						$(this).empty().append($("<i/>", {"class": "icon icon-arrow-left"}));
					}
					if($(this).find(".fa-arrow-right").length !== 0){
						$(this).empty().append($("<i/>", {"class": "icon icon-arrow-right"}));
					}
				});
			}
			else{
				$("#filter_block").empty().append("No results found").fadeIn(500);
			}
			//});
		},
		random_video: function(response){
			$("#loading_block").removeClass("active");
			if(response){
				//$("#filter_block").fadeOut(500, function(){
				$("#filter_block").empty().append(response).fadeIn(500);
				chrome.storage.local.get(["cache"], function(results){
					props.build_cache(results);
				});
				$("#filter_block .pagination").remove();
				//});
			}
			else{
				$("#filter_block").empty().append("No results found").fadeIn(500);
			}
		}
	};
	return {
		init: props.init,
		select_tab: props.select_tab,
		build_cache: props.build_cache
	}
})()

// TODO: single timer function for global use?
var notification_module = (function(){
	var props = {
		timer: null,
		init: function(){
			$("#message-block").after($("<section/>", {"id": "action_block", "class": "message-success hide_notification"}));
		},
		show: function(message){
			clearTimeout(props.timer);
			$("#action_block").text(message);
			$("#action_block").removeClass("hide_notification");
			props.timer = setTimeout(props.hide, 2000);
		},
		hide: function(){
			$("#action_block").addClass("hide_notification");
		}
	};
	return {
		init: props.init,
		show: props.show,
		hide: props.hide
	}
})()

var autoplay_module = (function(){
	var props = {
		timer: null,
		init: function(){
			chrome.storage.local.get(["cache", "playlist", "current"], function(results){
				if(results.playlist.length > 0){
					var current_id = results.playlist[results.current];
					var current_href = window.location.href;
					if(results.cache[current_id].video_url === current_href){
						//console.log("Match found, starting interval");
						props.tracker();
					}
				}
			});
		},
		tracker: function(){
			props.timer = setInterval(function(){
				var str = $(".js-vid-time").text();
				if(str.length > 0){
					var str_fragments = str.split('/');
					if(str_fragments.length === 2){
						var current_time = time_to_seconds(str_fragments[0]);
						var total_time = time_to_seconds(str_fragments[1]);
						//console.log("Current: " + current_time + " | " + "Total: " + total_time);
						// Check if time elapsed +2 seconds is more than the full length
						if(current_time + 2 >= total_time){
							//console.log("Video ended");
							(function(){
								var current_video = $("#playlist_container li.playing");
								if(current_video.length > 0 && current_video.next("li").length > 0){
									props.stop;
									$(".play_item:eq(" + (current_video.index() + 1) + ")").trigger("click");
								}
							})()
						}
					}
				}
			}, 1000);
		},
		stop: function(){
			clearInterval(props.timer);
		}
	};
	return {
		init: props.init
	}
})()

Object.size = function(obj){
    var size = 0, key;
    for(key in obj){
        if(obj.hasOwnProperty(key)) size++;
    }
    return size;
};

$(document).ready(function(){
	var promise = verify_cache();
	promise.done(function(message){
		filter_module.init();
		playlist_module.init();
		notification_module.init();
		autoplay_module.init();
		add_option_button();
	},
	function(){
		default_settings();
	});
});