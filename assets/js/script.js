/*=====================
phil@riotindustries.com
October 2014
=====================*/

var world = {};

$(document).ready(function(){
    console.log('document ready');

    //set variables to determine if scripts for a particular environment need to be called.
    mobileEnvironment = 1;
    tabletEnvironment = 0;
    desktopEnvironment = 0;

    $('body').addClass('mobile'); //assume mobile! mobile first, yo.

    universalController();
    environmentChecker();

    $(window).resize(function(){
        environmentChecker();
    });

}); //document.ready


/*==( ^ Checks to see if Mobile, Tablet, or Desktop )======================================================*/

function environmentChecker() {
    //console.log('environmentChecker `fired');

    if ($(window).width() >= 960) {
        if (tabletEnvironment == 0){
            tabletEnvironment = 1;
            // tabletController();
        }; //tabletcheck
        if (desktopEnvironment == 0){
            desktopEnvironment = 1;
            // desktopController(); 
        }; //desktopcheck
        $('body').removeClass('mobile').removeClass('tablet').addClass('desktop');
    } else if ($(window).width() >= 600) {
        if (tabletEnvironment == 0){
            tabletEnvironment = 1;
            // tabletController();
        }; //tabletcheck
        $('body').removeClass('mobile').removeClass('desktop').addClass('tablet');
    } else {
        $('body').removeClass('tablet').removeClass('desktop').addClass('mobile');
    }; //window.width

}; //environmentChecker



/*==( ^ Call universal functions. Not dependent on tablet/desktop, etc.
Most of these are in .length-called if statements. This helps us avoid
loading unecessary javascript only to find that there are no suitable
DOM elements to run on.
)======================================================*/

function universalController(){
  // handleSignin();
  loadFollowers();
  handleNav();
}; //universalController


function loadFollowers(){
  $('body').addClass('loading');
  $.getJSON('parsed_folks.json', function(data){
    console.log('Followers:', data);
    world.followers = _.reject(data, function(it){ return it.tweets.length == 0 });
    wrangle();
  }) //getJSON
}; //loadFollowers

function wrangle(){
  console.time('wrangling');
  var data = world.followers;
  //Remove K and commas from num_tweets, followers, and following
  $.each(data, function(){
    this.followers = this.followers ? numeral().unformat(this.followers.toLowerCase()) : 0;
    this.following = this.following ? numeral().unformat(this.following.toLowerCase()) : 0;
    this.num_tweets = this.num_tweets ? parseInt(numeral().unformat(this.num_tweets.toLowerCase()).toFixed(0)) : 0;
    this.favorites = this.favorites ? numeral().unformat(this.favorites.toLowerCase()) : 0;
    this.joinDate = this.joinDate ? parseInt(moment.duration(new Date().getTime() - moment(this.joinDate).format('X')*1000).asDays().toFixed(0)) : 731;
    // this.joinDate = this.joinDate ? parseInt(moment.duration(new Date().getTime() - moment(this.joinDate).format('X')*1000).asDays().toFixed(0)) : Math.floor((Math.random() * 730) + 1);;
    this.bio_length = this.bio.length;
    this.latest_tweet = this.tweets[0] ? parseInt(moment.duration(new Date().getTime() - moment(parseInt(this.tweets[0].timestamp))*1000).asDays().toFixed(0)) : 0;
    // console.log(this.tweets[0].timestamp);
    // this.most_recent_tweet = this.tweets ? parseInt(moment.duration(new Date().getTime() - moment(parseInt(this.tweets[0].timestamp)*1000)).asDays().toFixed(2)) : 0;
  }); //each
  console.timeEnd('wrangling');
  world.followers = _.sortBy(data, 'followers').reverse();
  extendData();
}; //wrangle

function extendData(){
  console.time('extending');
  var data = world.followers;
  world.followers = data;
  world.backup = data;
  compileData();
  console.timeEnd('extending');
}; //extendData

function compileData(){
  // console.log('compiling', world);
  source   = $("#some-template").html();
  template = Handlebars.compile(source);
  $("#twitter1").html(template(world));
  $('body').removeClass('loading');
}; //compileData





function handleNav(){
  $(document).on('click', 'aside nav a', function(it){
    var operation = $(this).parents('nav').attr('class');
    var facet = $(this).parent('div').attr('class');
    var property = $(this).attr('class').replace('active', '');
    var reverse = $(this).hasClass('active') ? true : false;
    $(this).addClass('active').siblings('.active').removeClass('active');

    if (operation == 'sortby') {
      $('body').addClass('loading');
      setTimeout(function(){
        sortBy(property, reverse);
      }, 200)
    };

  }); //on click

  $(document).on('click', 'button.setFilter', function(){
    $('body').addClass('loading');
    setTimeout(function(){
      setFilter();
    }, 200)
  })

  $(document).on('click', 'span.reset', function(){
    $('body').addClass('loading');
    setTimeout(function(){
      resetFilters();
    }, 200)
  })

  $(document).on('click', 'button.setRelative', function(){
    $('body').addClass('loading');
    setTimeout(function(){
      setRelative();
    }, 200)
  })

}; //handleNav

function sortBy(property, reverse){
  console.log('sorting by ' + property, reverse);
  if (reverse) {
    world.followers = world.followers.reverse();
  } else {
    world.followers = _.sortBy(world.followers, function(it){
      return it[property] ? it[property] : 0;
    }).reverse();    
  }
  compileData();
}; //sortBy


function resetFilters(){
  $('nav.filter').find('a.active').removeClass('active');
  $('nav.filter').find('input').val('');
  world.followers = world.backup;
  compileData();
}


function setFilter() {
  if (!$('.filter .operators .active') || !$('.filter .properties .active') || !$('.filter input').val() ) {
    alert('Hey - make sure you\'ve set all filter details');
  } else {
    world.followers = world.backup;
    var operator = $('.filter .operators .active').attr('class');
    var property = $('.filter .properties .active').attr('class').replace('active','').trim();
    var input = $('.filter input').val();
    console.log(operator, property, input);
    world.followers = _.filter(world.followers, function(it){
      if (operator.indexOf('less_than')>-1) {
        return it[property] < input;
      } else if (operator.indexOf('exactly')>-1) {
        return it[property] == input;
      } else if (operator.indexOf('more_than')>-1) {      
        return it[property] > input;
      }
    }); //_.filter
    compileData();
    if ($('.combine .un .active') || $('.combine .deux .active')) {
      setRelative();
    }
  }; //if all filled in
}





function setRelative() {
  if (!$('.combine .un .active') || !$('.combine .deux .active')) {
    alert('Hey - make sure you\'ve set both combination properties');
  } else {
    var p1 = $('.combine .un .active').attr('class').replace('active','').trim();
    var p2 = $('.combine .deux .active').attr('class').replace('active','').trim();
    world.followers = _.sortBy(world.followers, function(it){
      it.relative = it[p1] && it[p2] ? parseFloat((it[p1] / it[p2]).toFixed(2)) : 0;
      it.relative_terms = p1 + ' per ' + p2;
      return it.relative
    }).reverse();
    var graphData = _.map(world.followers, function(it){
      return [it[p2] ? it[p2] : 1, it[p1] ? it[p1] : 1]
    })
      drawScatterPlot(graphData, p1, p2);
  }; //if all filled in
}; //setRelative






function drawScatterPlot(graphData, term1, term2){
  d3.select('svg').remove();
      //Width and height
      var w = $('#world-container').width();
      var h = 500;
      var padding = 120;
      
      //Dynamic, random dataset
      dataset = graphData;                     //Initialize empty array
      // var numDataPoints = 1500;                   //Number of dummy data points to create
      // var maxRange = Math.random() * 1000;            //Max range of new values
      // for (var i = 0; i < numDataPoints; i++) {         //Loop numDataPoints times
      //   var newNumber1 = Math.floor(Math.random() * maxRange);  //New random integer
      //   var newNumber2 = Math.floor(Math.random() * maxRange);  //New random integer
      //   dataset.push([newNumber1, newNumber2]);         //Add new number to array
      // }

      //Create scale functions
// if suitably wide distance between min and max data points, use log scale rather than linear

// console.log('!!!', dataset);

var minX, maxX, minY, maxY;

minX = _.min(dataset, function(it){ return it[0] })[0];
maxX = _.max(dataset, function(it){ return it[0] })[0];
minY = _.min(dataset, function(it){ return it[1] })[1];
maxY = _.max(dataset, function(it){ return it[1] })[1];

// console.log(minX,maxX,minY,maxY);
    if (((minX+1)*300)<maxX && maxX > 10000) {
      console.log('LOG X')
      xScale = d3.scale.log()
        .domain([d3.min(dataset, function(d) { return d[0]; }), d3.max(dataset, function(d) { return d[0]; })])
        .range([padding, w - padding]);
    } else {
      console.log('LINEAR X')
      xScale = d3.scale.linear()
        .domain([d3.min(dataset, function(d) { return d[0]; })+1, d3.max(dataset, function(d) { return d[0]; })])
        .range([padding, w - padding]);
    }

    if (((minY+1)*300)<maxY && maxY > 10000) {
      console.log('LOG Y')
      yScale = d3.scale.log()
        .domain([d3.min(dataset, function(d) { return d[1]; }), d3.max(dataset, function(d) { return d[1]; })])
        .range([h - padding, padding]);
    } else {
      console.log('LINEAR Y')
      yScale = d3.scale.linear()
        .domain([d3.min(dataset, function(d) { return d[1]; })+1, d3.max(dataset, function(d) { return d[1]; })])
        .range([h - padding, padding]);
    }



      //Define X axis
      var xAxis = d3.svg.axis()
                .scale(xScale)
                .orient("bottom")
                .ticks(5, ",.1s")
                .tickSize(6, 0);
                // .ticks(5);

      //Define Y axis
      var yAxis = d3.svg.axis()
                .scale(yScale)
                .orient("left")
                .ticks(5, ",.1s")
                .tickSize(6, 0)

      //Create SVG element
      var svg = d3.select("#world-container header")
            .append("svg")
            .attr("width", w)
            .attr("height", h);

      //Create circles
      svg.append("g")
         .attr("id", "circles")
         .selectAll("circle")
         .data(dataset)
         .enter()
         .append("circle")
         .attr("cx", function(d) {
          // console.log(d[0],xScale(d[0]))
          return xScale(d[0]) > 0 ? xScale(d[0]) : 0;
         })
         .attr("cy", function(d) {
          // console.log(d[1], yScale(d[1]))
          return yScale(d[1]) > 0 ? yScale(d[1]) : 0;
         })
         .attr("r", 2);
      
      //Create X axis
      svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + (h - padding + 5) + ")")
        .call(xAxis);

      //Create Y axis
      svg.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(" + (padding - 5) + ",0)")
        .call(yAxis);


      svg.append("text")      // text label for the y axis
        .attr("transform", "translate(20," + (h/2) + "), rotate(-90)")
        .style("text-anchor", "middle")
        .text(term1);
      
      svg.append("text")      // text label for the x axis
        .attr("transform", "translate(" + (w/2) + ","+(h-50)+")")
        .style("text-anchor", "middle")
        .text(term2);


//Set Linear Regression line

var line = d3.svg.line()
    .x(function(d) { return xScale(d.date); })
    .y(function(d) { return yScale(d.close); });

// Derive a linear regression
  var lin = ss.linear_regression().data(dataset).line();

  // Create a line based on the beginning and endpoints of the range
  var lindata = xScale.domain().map(function(x,y,z) {
    // console.log(x,y,z);
    return {
      date: x,
      close: lin(+x) > 0 ? lin(+x) : 1
    };
  });
// console.log(lindata);
svg.append("path")
      .datum(lindata)
      .attr("class", "reg")
      .attr("d", line);



var meta = {};
meta.slope = ss.linear_regression().data(dataset).m() > 0 ? 'Positively' : 'Negatively';
meta.average = (_.reduce(_.pluck(world.followers, 'relative'), function(memo,it){ return memo+it; }) / world.followers.length).toFixed(2);
meta.min = (_.min(_.pluck(world.followers, 'relative'), function(it){ return it; })).toFixed(2);
meta.max = (_.max(_.pluck(world.followers, 'relative'), function(it){ return it; })).toFixed(2);
meta.size = dataset.length
meta.y = {
  'term': term1,
  'average': (_.reduce(dataset, function(memo,it){ return parseFloat(memo)+it[1]; }) / dataset.length).toFixed(2),
  'min': minY,
  'max': maxY,
};
meta.x = {
  'term': term2,
  'average': (_.reduce(dataset, function(memo,it){ return parseFloat(memo)+it[0]; }) / dataset.length).toFixed(2),
  'min': minX,
  'max': maxX,
};

world.meta = meta;


compileData();












      //On click, update with new data      
      d3.select(".randomer")
        .on("click", function() {

          //New values for dataset
          var numValues = dataset.length;               //Count original length of dataset
          var maxRange = Math.random() * 1000;            //Max range of new values
          dataset = [];                         //Initialize empty array
          for (var i = 0; i < numValues; i++) {           //Loop numValues times
            var newNumber1 = Math.floor(Math.random() * maxRange);  //New random integer
            var newNumber2 = Math.floor(Math.random() * maxRange);  //New random integer
            dataset.push([newNumber1, newNumber2]);         //Add new number to array
          }
          
          //Update scale domains
          xScale.domain([0, d3.max(dataset, function(d) { return d[0]; })]);
          yScale.domain([0, d3.max(dataset, function(d) { return d[1]; })]);

          //Update all circles
          svg.selectAll("circle")
             .data(dataset)
             .transition()
             .duration(1000)
             .attr("cx", function(d) {
              return xScale(d[0]);
             })
             .attr("cy", function(d) {
              return yScale(d[1]);
             });

          //Update X axis
          svg.select(".x.axis")
            .transition()
            .duration(1000)
            .call(xAxis);
          
          //Update Y axis
          svg.select(".y.axis")
            .transition()
            .duration(1000)
            .call(yAxis);

        });


}; //drawScatterPlot










Handlebars.registerHelper('commafy', function(num) {
  var str = num.toString().split('.');
  if (str[0].length >= 4) {
      str[0] = str[0].replace(/(\d)(?=(\d{3})+$)/g, '$1,');
  }
  if (str[1] && str[1].length >= 5) {
      str[1] = str[1].replace(/(\d{3})/g, '$1 ');
  }
  return new Handlebars.SafeString(str.join('.'));
});













































