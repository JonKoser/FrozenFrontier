//global variables
var currentYear = 1903;
var yearList = [];
var eventList = [];
var width = 980;
var timelineWidth = width-110;
var selectedEvent; //should start with the 1903 event

//begin script when window loads
window.onload = initialize();

//the first function called once the html is loaded
function initialize() {
    setMap();
    setWelcomeScreen();
};

function setWelcomeScreen () {
    var backgroundImage = d3.select("body")
        .style("background-image", "url(http://i.imgur.com/PKscn22.jpg?1)")
        .style("background-size", "100% auto");
       
    var welcomeInfo = d3.select("body")
         .append("div")
         .attr("id","welcomeInfo")
         .text("In the past century advances in human technology coupled with climatic change has made the formidable arctic accessible!");
}

//set choropleth map parameters
function setMap () {

    var mapWidth = 700,
      mapHeight = 700;
    
    var timelineBox = d3.select("body")
            .append("div")
            .attr("class", "timelineBox")
            .style("display","none");
    
    var infoPanelBox = d3.select("body")
            .append("div")
            .attr("class", "infoPanelBox")
            .style("display","none");
    
    
    var mapContainer = d3.select("body")
            .append("div")
            .attr("class", "mapContainer")
            .style("display","none");
    
    mapContainer.append("text")
        .attr("class", "displayYear")
        .text(currentYear);
    
    //create a new svg element with the above dimensions
    var map = d3.select(".mapContainer")
            .append("svg")
            .attr("class", "map")
            .attr("width", mapWidth)
            .attr("height", mapHeight);

    var projection = d3.geo.orthographic()
            .scale(500)
            .rotate([0, -90, 0])
            .translate([mapWidth / 2, mapHeight / 2])
            .clipAngle(90)
            .precision(.1);
        
    //creat svg path generator using the projection
    var path = d3.geo.path()
            .projection(projection);  
    
    //create graticule generator
    var graticule = d3.geo.graticule()
            //.step([10, 10]); //place graticule lines every 10 degrees

    //define a sphere object for the globe map
    map.append("defs").append("path")
        .datum({type: "Sphere"})
        .attr("id", "sphere")
        .attr("d", path);

    //give the globe a color
    map.append("use")
        .attr("class", "sphereFill")
        .attr("xlink:href", "#sphere");

    //give the globe a stroke
    map.append("use")
        .attr("class", "sphereStroke")
        .attr("xlink:href", "#sphere");

    //append a graticule to the globe
    map.append("path")
        .datum(graticule)
        .attr("class", "graticule")
        .attr("d", path);
    
    
    //use queue.js to parallelise asynchronous data loading
    queue()
        .defer(d3.json, "data/landOutline.topojson") //load attributes from topojson
        .defer(d3.json, "data/Test_Lines.topojson")
        .await(callback); //trigger callback function once data is loaded
   
    //retrieve and process NZ json file and data
    function callback(error, land, lines) {
        
        //projects the landmasses
        var landMasses = map.selectAll(".landMasses") 
                .data(topojson.feature(land, land.objects.landOutline).features)
                .enter() //create elements
                .append("g") //create landMasses group
                .attr("class", "landMasses") //assign class for styling
                .append("path")
                .attr("class", "landBody")
                .attr("d", path); //project data as geometry in svg 

        //projects the line events
        var line = map.selectAll(".line")
                .data(topojson.feature(lines, lines.objects.Test_Lines).features)
                .enter()
                .append("g")
                .attr("class", "line")
                .attr("id", function (d) {return d.properties.EvID})
                .append("path")
                .attr("d", path)
                .on("click", function (d) {
                    selectedEvent = d;
                    console.log(selectedEvent.properties);
                })
                .on("mouseover", highlight)
                .on("mouseout", dehighlight);
       

        //adds all events to single array (eventList)
        //also adds the years to the years array
        //put csv, polygons, and points in here also
        addEvents(lines);
        
        selectedEvent = eventList[0];
        makeTimeline();
        makeEventLine();
        updateLines();
        makeInfoPanel();
        updateInfoPanel();
    };//end callback
    
    
};// end setMap




//---------------NECESSARY FUNCTIONS--------------------------------------------------


//highlights the feature
function highlight (data) {
    
    d3.selectAll("#" + data.properties.EvID)
            .style("stroke-width", "3px");

} //end highlight

//-----------------------------------------------------------------------------------


//dehighlights the feature
function dehighlight(data) {
    d3.selectAll("#" + data.properties.EvID)
            .style("stroke-width", "1.5px");
}//end dehighlight



//-----------------------------------------------------------------------------------


//updates the big display year
function updateYear() {
    var yearText = d3.select(".displayYear");
    yearText.text(currentYear);
}//end display year


//-----------------------------------------------------------------------------------


//function to update which lines are being displayed
function updateLines() {
    var lines = d3.selectAll(".line")
            .style("stroke", function (d) {                  
                if (d.properties.Year == currentYear) {
                    switch (d.properties.Country) {
                            case "Canada":
                                return "yellow";
                                break;
                            case "Russia":
                                return "red";
                                break;
                            case "Norway":
                                return "blue";
                                break;
                            case "Denmark":
                                return "black";
                                break;
                            case "United States":
                                return "green";
                                break;
                            case "USSR":
                                return "red";
                                break;
                            default:
                                return "purple";
                    } //end switch statement
                    
                }
                else { //if not the current year
                    return "none";
                }
             });
    
}; //end update lines



//-----------------------------------------------------------------------------------



//makes the timeline
function makeTimeline (){
    
    //if we wanted to add in months for this stuff, we could I guess
    //var axisScale = d3.time.scale()
    //        .domain([new Date(1903, 0, 1), new Date(2014, 0, 1)])
    //        .range([0, 875]);
    
    //create a slider using http://bl.ocks.org/mbostock/6452972
    //which is a built-in brush slider for d3
    
    //sets up a scale for a data
    
    var timelineBox = d3.select(".timelineBox");
    var axisScale = d3.scale.linear()
            .domain([1903, 2014]) //range of years
            .range([0, timelineWidth]) //range of usable pixel space
            .clamp(true); //has to be within domain
    
    //set up the brush controler
    var brush = d3.svg.brush()
            .x(axisScale)
            .extent([0, 0])
            .on("brush", brushed) //what happens when it is brushed
            .on("brushend", brushend); //what happens when it's done being brushed
    
    //sets up the axis the timeline will run along
    var axisSpecs = d3.svg.axis()
            .scale(axisScale)
            .tickValues([1903, 2014])
            .tickFormat(d3.format("d"))
            .orient("top");
    
    //creates the timeline
    var timeline = timelineBox.append("svg")
            .attr("width", width)
            .attr("height", 32)
            .attr("class", "timeline")
        .append("g") //give the timeline a scaleable group object
            .attr("transform", "translate("+85+", "+25+")")
            .attr("class", "axis")
            .call(axisSpecs)
    
    //creates the slider object
    var slider = timeline.append("g")
            .attr("class", "slider")
            .call(brush);
    //dunno
    slider.selectAll(".extent, .resize")
            .remove();
    
    //gives the slider an icon
    var handle = slider.append("circle")
            .attr("class", "handle")
            .attr("r", 7);
        
    //stuff
    slider.call(brush.event)
            .transition() //gratuitous intro!
            .duration(750)
            .call(brush.extent([70, 70]))
            .call(brush.event);
    
    //the function that happens when it is brushed
    function brushed() {
        var value = brush.extent()[0];
        
        if (d3.event.sourceEvent) { //not a programatic event
            value = axisScale.invert(d3.mouse(this)[0]);
            brush.extent([value, value]);
        }
        
        handle.attr("cx", axisScale(value));
    
    } //end brushed
    
    
    //what happens when it is done being brushed
    function brushend() {
        if (!d3.event.sourceEvent) {
            return; //only transtion after input
        }
        
        var value = brush.extent()[0];
        brush.extent([value, value]);
        
        //select the brush slider and give it a transition
        d3.select(this)
            .transition()
            .duration(0)
            .call(brush.event);
        
        d3.select(this)
            .transition()
            .call(brush.extent(brush.extent().map(function(d) {
                    //round year to whole number
                    currentYear = d3.round(d, 0);
            
                    //if the current year is not a year from the list (loop through), 
                    //plus 1 until it is!!!!
                    var found = false; //variable to decide whether or not the year is in the list
                    while (found == false) {
                        //checks to see if the new year is in the usable year list
                        if (($.inArray(currentYear, yearList) == -1)) {
                            currentYear++;
                            //if year gets too high, just sets it to 2014
                            if (currentYear >= 2014) {
                                currentYear = 2014;
                                found = true;
                            }
                        }
                        
                        //if it is found in the list, does nothing and ends the loop
                        else {
                            found = true;
                        }
                    } //end while loop
                    //should put something in here to make it snap
                    //to meaningful values only
                    return currentYear; 
                    })))
            .call(brush.event);
        
        
        //update rest of map
        updateInfoPanel();
        updateLines();
        updateYear();
    }//end brushend

    
}; //end make timeline




//-----------------------------------------------------------------------------------




//this function puts the events below the timeline,
//colors them, and scales them
function makeEventLine () {
        
    //selects the timelne box
    var timelineBox = d3.select(".timelineBox");
    

    //adds a box to place events
    var eventBox = timelineBox.append("svg")
            .attr("width", width)
            .attr("height", 80)
            .attr("class", "eventBox");
    
    //creates a line for the events to travel on
    var eventsLine = eventBox.append("g")
            .attr("class", "eventsLine")
            .attr("transform", "translate("+85.5+", "+4+")"); //85.5 over, 4 down
    
    //creates the events and places them on the line
    var event = eventsLine.selectAll("event")
            .data(eventList) //uses the event list to register events
            .enter()
            .append("circle")
            .attr("transform", function (d) { 
                
                        //gives the event an x-position based on the usable width of the timeline
                        //and the year of the event. Our range of years is between 1903 and 2014 and
                        //the width of the timeline is timelineWidth
                        var x = (((timelineWidth)/(2014-1903))*(d.properties.Year-1903));
                
                        //give the event a y-position based on which country the event belongs to
                        var y;
                        switch (d.properties.Country) {
                            case "Canada":
                                y=6;
                                break;
                            case "Russia":
                                y=20;
                                break;
                            case "Norway":
                                y=34;
                                break;
                            case "Denmark":
                                y=48;
                                break;
                            case "United States":
                                y=62
                                break;
                            case "USSR":
                                y=20;
                                break;
                            default:
                                y=6;
                        } //end switch statement
                
                        //sets the position of the dot
                        return "translate(" + x + ", " + y + ")";
            })
            .attr("stroke", function(d) { //sets the color of the label
                        switch(d.properties.Country) {
                            case "Canada":
                                return "yellow";
                                break;
                            case "Russia":
                                return "red";
                                break;
                            case "Norway":
                                return "blue";
                                break;
                            case "Denmark":
                                return "White";
                                break;
                            case "United States":
                                return "green";
                                break;
                            case "USSR":
                                return "red";
                                break;
                            default:
                                return "purple";
                        } //end switch statement
            })
            .attr("r", 6)
            .attr("class", "event")
            .attr("id", function(d) {return d.properties.EvID})
            .attr("fill", "transparent")
            .on("click", function (d) { 
                currentYear = d.properties.Year; //assigns a new current year
                selectedEvent = d; //assigns the selected event
                var trans = d3.transform(d3.select(this).attr("transform")) //gets the transform of the point
                var xVal = trans.translate[0]; //gets the x-value position (translation) of the clicked point
                //moves the handle
                d3.select(".handle")
                        .transition() //well, that was easy
                        .duration(700)
                        .attr("cx", xVal);//d.attr("transform").translate[0]);
                
                //update the rest of the stuff
                updateInfoPanel();
                updateLines();
                updateYear();
            })
            .on("mouseover", highlight)
            .on("mouseout", dehighlight); //end of event
    
    //creates labels for the countries
    var countryNames = ["Canada:", "Russia:", "Norway:", "United States:", "Denmark:"]
    var countryLabels = eventsLine.selectAll("countryLabels")
            .data(countryNames) //the frozen 5
            .enter()
            .append("g")
            .attr("class", "countryLabels")
            .append("text")
            .text(function(d) {return d})
            .attr("transform", function (d) { //sets the y height of the label
                        switch (d) {
                            case "Canada:":
                                y=6;
                                break;
                            case "Russia:":
                                y=20;
                                break;
                            case "Norway:":
                                y=34;
                                break; 
                            case "Denmark:":
                                y=48;
                                break;
                            case "United States:":
                                y=62;
                                break;                                
                            default:
                                y=6;
                        } //end switch statement
                        //sets the position of the label
                        return "translate(" + -80+ ", " + (y+5) + ")";
            })
            .attr("fill", function(d) { //sets the color of the label
                        switch(d) {
                            case "Canada:":
                                return "yellow";
                                break;
                            case "Russia:":
                                return "red";
                                break;
                            case "Norway:":
                                return "blue";
                                break;
                            case "Denmark:":
                                return "White";
                                break;
                            case "United States:":
                                return "green";
                                break;
                            case "USSR:":
                                return "red";
                                break;
                            default:
                                return "purple";
                        } //end switch statement
            });// end country Lables
    
    /*//creates dividing lines for the countries' events
    var dividerLines = eventsLine.selectAll("dividerLines")
            .data(countryNames)
            .enter()
            .append("g")
            .attr("class", "dividerLines")
            .append("svg:line")
            .attr("x1", 0)
            .attr("y1", function (d) {
                        switch (d) {
                            case "Canada:":
                                return 6;
                                break;
                            case "Russia:":
                                return 20;
                                break;
                            case "Norway:":
                                return 34;
                                break; 
                            case "Denmark:":
                                return 48;
                                break;
                            case "United States:":
                                return 62;
                                break;                                
                            default:
                                return 6;
                        } //end switch statement         
            
            })
            .attr("y2", function (d) {
                        switch (d) {
                            case "Canada:":
                                return 6;
                                break;
                            case "Russia:":
                                return 20;
                                break;
                            case "Norway:":
                                return 34;
                                break; 
                            case "Denmark:":
                                return 48;
                                break;
                            case "United States:":
                                return 62;
                                break;                                
                            default:
                                return 6;
                        } //end switch statement         
            
            })
            .attr("x2", width)
            .style("stroke", "gray")
            .style("stroke-width", "1pt")
            .attr("transform", "translate(" + (-80)+ ", " + (7) + ")");*/
                
    
}// end make event line



//-----------------------------------------------------------------------------------


// function to create the info panel
function makeInfoPanel (infoPanelBox) {

    d3.select(".infoPanelBox")
            .append("div")
            .attr("id", "accordion")
            .html("<h3 id='eventName'>Event 1</h3><div><p id='eventDescrip'></p></div>");
    
    $("#accordion").accordion({
        collapsible: true,
        heightStyle: "content"
    });
    
}; //end make info panel box




//-----------------------------------------------------------------------------------


//function to update the contents of the info panel
function updateInfoPanel() {
    var description;
    var name;
    
    name = selectedEvent.properties.Name
    description = selectedEvent.properties.Descrip

    
    d3.select("#eventDescrip")
            .text(description);
    d3.select("#eventName")
            .text(name);
    

}; //end update info panel




//-----------------------------------------------------------------------------------




//button functionality, at this moment only goes from welcome screen to map. Also trying to get transitions to work.
function changeVisibility() {
    d3.select(".timelineBox")
        .transition()
        .duration(1000)
        .style("display","block");
    d3.select(".infoPanelBox")
        .style("display","block");
    d3.select(".mapContainer")
        .style("display","block");
    d3.select("#welcomeInfo")
        .style("display","none");
    d3.select("#button")
        .style("display", "none");
}; //end changeVisibility



//-----------------------------------------------------------------------------------



//adds events to single array and years to year list
function addEvents(lines) {
    
    //adds the line events
    var lineEvents = lines.objects.Test_Lines.geometries
    for (var i = 0; i < lineEvents.length; i++) {
        //adds the whole event to the event list
        eventList.push(lineEvents[i]);
        //adds the year to the year list
        yearList.push(lineEvents[i].properties.Year);
    }
    
    
    
    //adds the point events
    
    //adds the polygon events
    
    //adds the csv events
    
    //sorts the event list from first to last by year
    eventList.sort(function(obj1, obj2) {
        return obj1.properties.Year - obj2.properties.Year;
    })

    
}; //end addEvents
