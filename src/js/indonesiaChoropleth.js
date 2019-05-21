export const indonesiaChoropleth = (id, filename, datafile) => {

  let w = 1200,
      h = 400;

  let margin = {
    top: 60,
    bottom: 40,
    left: 70,
    right: 40
  };

  let tooltip = d3.select(`#${id}`)
                  .append("div")
                  .style("position", "fixed")
                  .style("z-index", 1)
                  .style("visibility", "hidden");;

  // define map projection
  let projection = d3.geoMercator()
                    .translate([-1900, 150])
                    .scale([1200]);

  //Define default path generator
  let path = d3.geoPath()
              .projection(projection);

  // Create the SVG for the map            
  let svg = d3.select(`#${id}`)
              .append("svg")
              .attr("id", "chart")
              .attr("width", w)
              .attr("height", h)
              .append("g")
              .attr("tranform", `translate(${margin.left}, ${margin.top})`);


  // Make the number easier to read
  let commaSeparate = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  let lengthOfData;
  let jsonFeatures;

  // Store all of the total here
  let candidateOneTotal = 0; 
  let candidateTwoTotal = 0;
  let allTotal = 0;

  // Winning in ..... provinces
  let jokomarufWins = 0;
  let prabowosandiWins = 0;

  // Scale the color using vote percentage as range for Jokowi Maruf
  let candidateOneColor = d3.scaleLinear()
                            .domain([.5, .6, .7, .8, .9])
                            .range(["#E05F6B", "#DD4F5D", "#C94855", "#B5414D", "#A13A44"])

  // Scale the color using vote percentage as range for Prabowo Sandi
  let candidateTwoColor = d3.scaleLinear()
                            .domain([.5, .6, .7, .8, .9])
                            .range(["#85B4DF", "#79ADDC", "#6E9EC8", "#648EB5", "#597EA1"])


  d3.csv(datafile, (error, data) => {

    lengthOfData = data.length;

    d3.json(filename, (error, id) => {

      if (error) {
        return console.log(error);
      }

      for (let i = 0; i< lengthOfData; i++) {
        // the key to GET the election result data
        let provinceName = data[i]["province"];

        // ELECTION RESULT DATA STARTS HERE

        // The amount of votes that the 1st candidate received
        let candidateOne = parseFloat(data[i]["jokomaruf"]);
        candidateOneTotal += candidateOne;
        allTotal += candidateOne;

        // The amount of votes that the 2nd candidate received
        let candidateTwo = parseFloat(data[i]["prabowosandi"]);
        candidateTwoTotal += candidateTwo;
        allTotal += candidateTwo;

        // Luar Negeri doesn't have any location in the TOPOjson file (needs a better way to handle this)
        if (i < lengthOfData - 1) {
          jsonFeatures = topojson.feature(id, id.objects.regions).features;

          for (let j = 0; i < jsonFeatures.length; j++) {

            let provinceNameJSON;

            if (jsonFeatures[j]["properties"]["name"] == null) {
                continue;
            } else {
                provinceNameJSON = jsonFeatures[j]["properties"]["name"];
            }

            if (provinceNameJSON.toLowerCase() == provinceName.toLowerCase()) {

              jsonFeatures[j]["properties"]["candidateOne"] = candidateOne;

              jsonFeatures[j]["properties"]["candidateTwo"] = candidateTwo;
              break;
            }
          }

        }
      }
      
      // Controls the total votes
      d3.select("#total-votes")
        .text(() => {
          return commaSeparate(allTotal);
        })
      
      d3.select("#jokomaruf-vote")
        .text(commaSeparate(candidateOneTotal));
      
      d3.select("#prabowosandi-vote")
        .text(commaSeparate(candidateTwoTotal));

      d3.select("#jokomaruf-vote-percentage")
        .text(() => {
          return `${(candidateOneTotal / (candidateOneTotal + candidateTwoTotal) * 100).toFixed(2)}%`;
        })
      
      d3.select("#prabowosandi-vote-percentage")
        .text(() => {
          return `${(candidateTwoTotal / (candidateOneTotal + candidateTwoTotal) * 100).toFixed(2)}%`;
        })

      svg.selectAll(".province")
          .data(jsonFeatures)
          .enter()
          .append("path")
          .attr("d", path)
          .attr("class", "province")
          .attr("id", d => {
            // Create specific ID for each paths, so it will be easier for the on mouseover event
            return d["properties"]["postal"];
          })
          .style("fill", d => {

            // Check if the total votes for candidate one is greater than candidate two for each province
            if (d["properties"]["candidateOne"] > d["properties"]["candidateTwo"]) {
              jokomarufWins += 1;

              return candidateOneColor(d["properties"]["candidateOne"]/ (d["properties"]["candidateOne"] + d["properties"]["candidateTwo"]));
            } else if (d["properties"]["candidateOne"] < d["properties"]["candidateTwo"]) {
              prabowosandiWins += 1;
              return candidateTwoColor(d["properties"]["candidateTwo"]/ (d["properties"]["candidateOne"] + d["properties"]["candidateTwo"]))
            }
          })
          .style('stroke', 'black')
          .on("mouseover", d => {

            let tempTotal = d["properties"]["candidateOne"] + d["properties"]["candidateTwo"]
            let tempCandidateOnePercentage = ((d["properties"]["candidateOne"] / tempTotal) * 100).toFixed(2)
            let tempCandidateTwoPercentage = ((d["properties"]["candidateTwo"] / tempTotal) * 100).toFixed(2)

            // Tooltip will appear on mouseover
            tooltip.html(`
              <div class="tooltip">
                <p style="text-align: center; font-weight: bold; font-size: 14px; padding: 0 0 3px 0;">${d["properties"]["name"].toUpperCase()}</p>
                <p><span style="font-size: 18px; font-weight: bold; float: left; color: #AC0B13;">${tempCandidateOnePercentage}%</span> <span style="font-size: 18px; font-weight: bold; float: right; color: #597EA1;">${tempCandidateTwoPercentage}%</span></p><br/>
                <p style=" clear: both; padding: 0 2px 3px 2px;"><span style="float: left; color: #AC0B13;">${commaSeparate(d["properties"]["candidateOne"])}</span> <span style="float: right; color: #597EA1;">${commaSeparate(d["properties"]["candidateTwo"])}</span></p><br/>
              </div>
            `)

            tooltip.style("visibility", "visible");
          })
          .on("mouseout", () => {
              tooltip.style("visibility", "hidden");
          })
          .on("mousemove", () => {
              tooltip.style("top", `${d3.event.clientY - 100}px`)
                      .style("left", `${d3.event.clientX - 80}px`);    
          })

        // Winning in ..... provinces
        d3.select("#jokomaruf-wins")
          .text(`${jokomarufWins} Provinsi`);
        
        d3.select("#prabowosandi-wins")
          .text(`${prabowosandiWins} Provinsi`); 
        
    })

    // THE CODE THAT CONTROLS THE "PRESIDEN" BUTTON STARTS HERE
    d3.select("#presidential-election-dom")
    .on("click", () => {

      // Winning in ..... provinces
      d3.select("#jokomaruf-wins")
      .text(`${jokomarufWins} Provinsi`);
    
      d3.select("#prabowosandi-wins")
      .text(`${prabowosandiWins} Provinsi`);

      d3.select("#legislative-election-dom")
        .style("background-color", "#D4D4AA");

      d3.select("#legislative-election-overseas")
        .style("background-color", "#D4D4AA");

      d3.select("#presidential-election-dom")
        .style("background-color", "#99AE8C");

        d3.select("#presidential-election-overseas")
        .style("background-color", "#BAD4AA");

      d3.select("#president")
        .style("display", "block");

      d3.select("#world-choropleth")
        .style("display", "none");

      d3.select("#indonesia-choropleth")
        .style("display", "block");
      
      d3.select("#color-by")
        .style("display", "block");

      d3.select("#legislative")
        .style("display", "none");


      svg.selectAll(".province")
        .transition()
        .duration(1000)
        .style("fill", d => {
          if (d["properties"]["candidateOne"] > d["properties"]["candidateTwo"]) {
            return candidateOneColor(d["properties"]["candidateOne"]/ (d["properties"]["candidateOne"] + d["properties"]["candidateTwo"]));
          } else {
            return candidateTwoColor(d["properties"]["candidateTwo"]/ (d["properties"]["candidateOne"] + d["properties"]["candidateTwo"]))
          }
        })

      svg.selectAll(".province")
        .style("cursor", "default")
        .on("mouseover", d => {

          let tempTotal = d["properties"]["candidateOne"] + d["properties"]["candidateTwo"]
          let tempCandidateOnePercentage = ((d["properties"]["candidateOne"] / tempTotal) * 100).toFixed(2)
          let tempCandidateTwoPercentage = ((d["properties"]["candidateTwo"] / tempTotal) * 100).toFixed(2)

          tooltip.html(`
            <div class="tooltip">
              <p style="text-align: center; font-weight: bold; font-size: 14px; padding: 0 0 3px 0;">${d["properties"]["name"].toUpperCase()}</p>
              <p><span style="font-size: 18px; font-weight: bold; float: left; color: #AC0B13;">${tempCandidateOnePercentage}%</span> <span style="font-size: 18px; font-weight: bold; float: right; color: #597EA1;">${tempCandidateTwoPercentage}%</span></p><br/>
              <p style="padding: 0 2px 3px 2px;"><span style="float: left; color: #AC0B13;">${commaSeparate(d["properties"]["candidateOne"])}</span> <span style="float: right; color: #597EA1;">${commaSeparate(d["properties"]["candidateTwo"])}</span></p><br/>
            </div>
          `)

          tooltip.style("visibility", "visible");
        })
        .on("mousemove", () => {
          tooltip.style("top", `${d3.event.clientY - 100}px`)
                  .style("left", `${d3.event.clientX - 80}px`);    
        })
      
    })
  })

  

}