var slider , searchfield ,srnav ,startlink, searchres, art_page_nav,
	artsHolder,artsImage,artsBio,artsTracks,artsName,artsplhld,
	tracksHolder,tracksTracks,tracksName,trksplhld, //крекс пекс фекс
	seesu =  {
		version: 0.1
		
	},
	vk_logged_in,
	wait_for_vklogin = {},
	//referers = ['http://vk.com/reg198193','http://vk.com/reg1114384','http://vk.com/reg37829378','http://vk.com/reg668467'],
	vkReferer = '';//referers[Math.floor(Math.random()*4)];

var updatex = new XMLHttpRequest ();
updatex.onreadystatechange = function(){
  if (this.readyState == 4) {
	var r = JSON.parse(updatex.responseText);
	var cver = r.latest_version.number;
	if (cver > seesu.version) {
		var message = 
		 'Suddenly, Seesu ' + cver + ' has come. ' + 
		 'You have version ' + seesu.version + '. ';
		var link = r.latest_version.link;
		if (link.indexOf('http') != -1) {
			widget.showNotification(message, function(){
				widget.openURL(link);
			})
		}

	}
	
	vkReferer = r.vk_referer;
	
	log(vkReferer);	
	log(updatex.responseText);
  }
};
updatex.open('POST', 'http://seesu.heroku.com/update');
updatex.xhrparams = 
  'hash=' + hex_md5(widget.identifier) + '&' +
  'version=' + seesu.version + '&' +
  'demension_x=' + widget.preferenceForKey('width') + '&' + 
  'demension_y=' + widget.preferenceForKey('height');
  
log(updatex.xhrparams);

updatex.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
updatex.send(updatex.xhrparams);

var vk_logg_in = function(id,email){
	widget.setPreferenceForKey(id, 'vkid');
	widget.setPreferenceForKey(email, 'vkemail');
	vk_logged_in = true;
	$(document.body).addClass('vk-logged-in');
	log('вошли в контакте и скрыли форму логина')
}
var vk_logged_out = function(){
	widget.setPreferenceForKey(null, 'vkid');
	widget.setPreferenceForKey(null, 'vkemail');
	vk_logged_in = false;
	$(document.body).removeClass('vk-logged-in');
	log('отображаем форму логина где нужно')
	
}

var loginxhr = new XMLHttpRequest ();
loginxhr.onreadystatechange = function(){
  if (this.readyState == 4) {
  	log(loginxhr.responseText);
	if ((loginxhr.responseText.indexOf('id') != -1) && 
		(loginxhr.responseText.indexOf('email') != -1) && 
		(loginxhr.responseText.indexOf('sid') != -1) && 
		(loginxhr.responseText.indexOf('pass') != -1)  ) {
		var r = JSON.parse(loginxhr.responseText);
		if (r.id) {
			log(vk_logged_in)
			vk_logg_in(r.id, r.email);
			wait_for_vklogin && wait_for_vklogin();
		}	
	} else log('не получается войти')
  }
};
loginxhr.open('POST', 'http://vkontakte.ru/login.php');
loginxhr.xhrparams = 'noredirect=1';
loginxhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
loginxhr.setRequestHeader("host", "vkontakte.ru");


var parseStrToObj = function(onclickstring){
	var b = onclickstring,
		fname = '';
	b = b.substring(b.indexOf('(') + 1, b.indexOf(')'));
	var params = b.split(','),
		server = params[1],
		user = params[2];
	while (user.length < 5) user = '0' + user;
	fname = params[3];
	fname = fname.substring(1, fname.length - 1);
	var obj ={'sever': server, 'user' : user , 'filename' : fname, 'link' : ('http://cs' + server + '.vkontakte.ru/u' + user + '/audio/' + fname + '.mp3')};
	return obj;

}


var getMusic = function(trackname){
	if (!vk_logged_in) return false
	
	var musicList = [];
	musicList.links = [];
	musicList.playlist = [];
	var xhr = new XMLHttpRequest ();
	
	xhr.onreadystatechange = function () {
	  if ( this.readyState == 4 ) {
	  	log(xhr.responseText);
		if (xhr.responseText.indexOf('rows') != -1) {
			var srd = document.createElement('div');
			srd.innerHTML = JSON.parse(xhr.responseText).rows;
			var rows = $(".audioRow ", srd);

			for (var i=0, l = rows.length; i < l; i++) {
				var row = rows[i],
					text = $('.audioText', row)[0],
					artist = $('b', text)[0].textContent,
					track = $('span', text)[0].textContent,
					playStr = $('img.playimg', row )[0].getAttribute('onclick'),
					obj = parseStrToObj(playStr);
				musicList.links.push(obj.link);
				musicList.playlist.push(artist + ' - ' + track);
				obj.artist = artist;
				obj.track = track;
				
				musicList.push(obj);
			};
		} else {
			log('Поиск не удался... :’—(');
			if ((xhr.responseText.indexOf('http://vkontakte.ru/login.php?op=logout') != -1) && xhr.responseText.indexOf('http://vkontakte.ru/images/progress.gif' != -1)) {
				vk_logged_out();
				log('квантакте изгнал вас из рая')
			}
			return false
		}
	  }
	};
	xhr.open( 'POST', 'http://vkontakte.ru/gsearch.php', false );
	var param = 'c[section]=audio' + '&c[q]=' + encodeURIComponent(trackname);
	xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
	xhr.send(param);
		
	return musicList
}
var get_vk_track = function(trackname,tracknode,playlist_nodes_for) {
	if (!vk_logged_in) return false
	var now = (new Date()).getTime(),
		timeout;
	
	arguments.callee.call_at = arguments.callee.call_at || now;
	if ( arguments.callee.call_at && (arguments.callee.call_at > now)) {
		timeout = arguments.callee.call_at - now;
	} else {
		timeout = 0;
		arguments.callee.call_at = now;
	}
	
	setTimeout(function(){
		$.ajax({
		  url: "http://vkontakte.ru/gsearch.php",
		  global: false,
		  type: "POST",
		  data: ({'c[section]' : 'audio', 'c[q]' : trackname}),
		  dataType: "json",
		  beforeSend: function(){
		  	tracknode.addClass('search-mp3');
		  },
		  error: function(){
		  	tracknode.attr('class' , 'search-mp3-failed');
	 	  },
		  success: function(r){
		  	log('Квантакте говорит: ' + r.summary);
			var srd = document.createElement('div');
				srd.innerHTML = r.rows;
			var rows = $(".audioRow ", srd);
			if (rows.length) {
				var row = rows[0],
					playStr = $('img.playimg', row )[0].getAttribute('onclick'),
					link = parseStrToObj(playStr).link;
				make_node_playable(tracknode,link,playlist_nodes_for);
			} else {
				tracknode.attr('class' , 'search-mp3-failed');
			}
			
		  }
		});
	},timeout)
	
	arguments.callee.call_at += 900;
	
	return
}

var make_tracklist_playable = function(playlist,track_nodes){
	if (vk_logged_in) {
		var songNodes = [],
			timeout = 0;
		for (var i=0, l =  playlist.length; i < l; i++) {
			var node = track_nodes[i],
				trackname = playlist[i],
				playlist_nodes_for = songNodes;
			get_vk_track(trackname,node,playlist_nodes_for);
		};
	}
}
var make_node_playable = function(node,http_link,playlist_nodes_for){
	var playable_node = $(node).attr({'class' : 'song', 'href' : http_link} );
	playlist_nodes_for.push(playable_node);

	var playlist_length = playlist_nodes_for.length;
	if (playlist_length == 1) {
		set_current_song(playable_node);
		current_playlist = playlist_nodes_for;
	}
	
	playable_node.data('number_in_playlist', playlist_length-1);
	playable_node.data('link_to_playlist', playlist_nodes_for);
	
	
	var mp3 = $("<a></a>").attr({ 'class': 'download-mp3', 'text': 'mp3', 'href': http_link });
	playable_node.parent().append(mp3);
}
var getObjectsByPlaylist = function(playlist,links) {
	if (vk_logged_in) {
		var songNodes = [];
		log(playlist);
		for (var i = 0, l = playlist.length; i < l; i++) {
			links[i].addClass('search-mp3');
			var searchingResults = getMusic(playlist[i]);
			if (searchingResults[0] && searchingResults[0].link) {
				if (links) {	//if links present than do live rendering
					var link = searchingResults[0].link,
						node = links[i];
					make_node_playable(node,link,songNodes);
				}
			} else  links[i].attr('class' , 'search-mp3-failed');
		}
	
		if (songNodes.length)
			return true;
	
 		log("Can’t get objects from playlist... :’—(");
		return false;
	} else {
		log('wait for vklogin');
		wait_for_vklogin = function(){
			getObjectsByPlaylist(playlist,links);
		} 
		
	}	
}
var prerenderPlaylist = function(playlist,container,mp3links) { // if links present than do full rendering! yearh!
	var linkNodes = [];
	var songNodes = [];

	var ul = document.createElement("ul");
	
	for (var i=0, l = playlist.length; i < l; i++) {
		var attrs = {'text': playlist[i]};
		var track = $("<a></a>").attr(attrs),
		li = document.createElement('li');
		if (mp3links) {
			var link = mp3links[i];
			make_node_playable(track,link,songNodes)
		};
		$(li).append(track);
		$(ul).append(li);		
		linkNodes.push(track);
	};
	(container && container.html('').append(ul)) || ($(searchres).html('').append(ul) && mp3links && (slider.className = 'screen-search'));
	return linkNodes
	
}
var getTopTracks = function(artist) {
	var tracks = lastfm('artist.getTopTracks',{'artist': artist }).toptracks.track || false;
	if (tracks) {
		var playlist = [];
		for (var i=0, l = (tracks.length < 15) ? tracks.length : 15; i < l; i++) {
			playlist.push(artist + ' - ' + tracks[i].name);
		};
		return playlist
		
	} else return false
}

var setArtistPage = function (artist,image) {
	slider.className = 'sreen-artist-page';
	player_holder = artsplhld;
	if (nav_artist_page.textContent == artist) return true;
	nav_artist_page.innerHTML = artist;
	var bio = lastfm('artist.getInfo',{'artist': artist }).artist.bio.summary;
	artsName.text(artist);
	image && artsImage.attr('src',image);
	artsBio.html(bio || '');
	var traaaks = getTopTracks(artist);
	if (traaaks) {
		var links = prerenderPlaylist(traaaks,artsTracks);
		make_tracklist_playable(traaaks,links)
		//getObjectsByPlaylist(traaaks,links);
	}
	
	
	
}
var artistsearch = function(artist) {
	
	var artists = lastfm('artist.search',{artist: artist, limit: 10 }).results.artistmatches.artist || false; 
	if (artists){

		var image = artists[0].image[1]['#text'];
		setArtistPage(artists[0].name,image);
		
		
		searchres.innerHTML = '';
		var ul = $("<ul></ul>").attr({ class: 'results-artists'});
		$(searchres).append(ul);
		for (var i=0; i < artists.length; i++) {
			var artist = artists[i].name;
			var image = artists[i].image[1]['#text'] || 'http://cdn.last.fm/flatness/catalogue/noimage/2/default_artist_medium.png';
			var li = $("<li></li>").data('artist',artist);
			li.data('img', image)
			$(li).click(function(){
				var artist = $(this).data('artist');
				var image = $(this).data('img');
				setArtistPage(artist,image);

			
			});
			var p = $("<p></p>").attr({ text: artist});
			if(image){
				var img = $("<img/>").attr({ src: image , alt: artist });
				$(li).append(img);
			} 
			
			$(li).append(p);
			$(ul).append(li);
		};
		
	} else {
		searchres.innerHTML = '';
		var p = $("<p></p>")
			.attr({ 
				text: 'Ничё нет'
			});
		$(searchres).append(p);
		slider.className = "screen-search";
	}
}


window.addEventListener( 'load' , function(){
	$('#close-widget').click(function(){
		window.close();
	})
  	
	//see var at top
  slider = document.getElementById('slider'),
  searchfield = document.getElementById('q'),
  srnav = document.getElementById('search_result_nav'),
  startlink = document.getElementById('start_search'),
  searchres = document.getElementById('search_result'),
  art_page_nav = document.getElementById('nav_artist_page');
  trk_page_nav = document.getElementById('nav_tracks_page')
  startlink.onclick = function(){
  	slider.className = "screen-start";
  };
  srnav.onclick = function(){
  	slider.className = "screen-search";
  };

	artsHolder	= $('#artist-holder'),
	artsImage	= $('img.artist-image',artsHolder),
	artsBio		= $('p.artist-bio',artsHolder),
	artsTracks	= $('.tracks-for-play',artsHolder),
	artsplhld	= $('.player-holder',artsHolder),
	artsName	= $('#artist-name');
	
	tracksHolder = $('#tracks-holder'),
	tracksTracks = $('.tracks-for-play', tracksHolder),
	tracksName	 = $('#tracks-name');
	trksplhld 	 = $('.player-holder',tracksHolder),


$('.vk-auth').submit(function(){
	var _this = $(this);
	var email = $('input.vk-email',_this).val();
	var pass = $('input.vk-pass',_this).val();
	loginxhr.send(loginxhr.xhrparams + '&email=' + encodeURIComponent(email) + '&pass=' + encodeURIComponent(pass));	
	return false;
})


 /* document.getElementById('auth').onsubmit = function(){
	loginxhr.xhrparams += '&email=' + encodeURIComponent($('#email')[0].value) + '&pass=' + encodeURIComponent($('#pass')[0].value);
	loginxhr.send(loginxhr.xhrparams);	//логин
	return false;
  };*/
  if (widget.preferenceForKey('vkid')) {
  	$(document.body).addClass('vk-logged-in');
  	vk_logged_in = true;
  } else{
	log('not loggin in')
}



	$('#search-artist').click(function(){
		var query = searchfield.value;
		if (query) {
			artistsearch(query)
		}
		
		
	});
	$('#search-tag').click(function(){
		
	});
	$('#search-track').click(function(e){
		var _this = $(this);
		var query = searchfield.value;
		if (query) {
			trk_page_nav.innerHTML = query;
			tracksName.text(query)
			slider.className = 'sreen-tracks-page';
			player_holder  = trksplhld;
				
			var musicObj = getMusic(query);
			if (musicObj) {
				
				prerenderPlaylist(musicObj.playlist,tracksTracks,musicObj.links);
			} else {
				wait_for_vklogin = function(){
					_this.click()
				}
			};
		}
		
	});

}, false);

