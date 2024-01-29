let svg;
const height = 725;
const width = 1500;
const margin = {top : 30, right : 30, bottom : 30, left : 30};
const chartHeight = height - margin.top - margin.bottom;
const chartWidth = width - margin.left - margin.right;
let universal_array = [];
let selected_region;
let selected_attribute_values_X = [];
let final_array = [];
let playButtonClicked = false;
let colorCodes = ['#FF5733','#334FFF','#CA1AB8','#FDEE05','#18170E','#04F1F5','#CF2DDA'];
let allPossibleRegions = ['East Asia & Pacific','Europe & Central Asia','Latin America & Caribbean','Middle East & North Africa','North America','South Asia','Sub-Saharan Africa'];
let colors = d3.scaleOrdinal().domain(allPossibleRegions).range(colorCodes);

document.addEventListener('DOMContentLoaded', function () {

    svg = d3.select('#beeswarm')
            .attr('width', width)
            .attr('height', height);

    Promise.all([d3.csv('data/global_development.csv'),d3.csv('data/countries_regions.csv')])
        .then(function (values){

            let global_dev = values[0];
            let countries = values[1];
            universal_array = [];

            for(let i=0; i<global_dev.length; i++){

                for(let j=0; j<countries.length; j++){

                    if(global_dev[i]["Country"] == countries[j]["name"]){
                        let combinedObject = {...global_dev[i],...countries[j]};
                        universal_array.push(combinedObject);
                    }
                }

            }


            checkIfButtonClicked(); 
            

        })

});

function checkIfButtonClicked(){
    
    console.log('here',playButtonClicked);
            
                if(playButtonClicked == false){
                    drawBeeSwarm();   
                } else{
                    drawPlaySwarm();
                }

}

function drawBeeSwarm(){

    document.getElementById('control-panel').addEventListener('change', ()=> {

        let attributeX = document.getElementById("dropDownAttributeX-Axis").value;
        let attributeSize = document.getElementById("dropDownAttributeSize").value; 
        let year = document.getElementById("year").value;

    

        let checkedValues = []; 
        let checkedElements = document.getElementsByClassName('checkbox');
        for(let i=0; i<checkedElements.length;i++){
            if(checkedElements[i].checked){
                checkedValues.push(checkedElements[i].value);
            }
        }


        if(attributeX == "None" || attributeSize == "None" || checkedValues.length == 0){
            svg.selectAll("*").remove();
        } else{

            {
               
                    /** Adding a legend **/


    let size1 = 10
    svg.selectAll("legend")
        .data(checkedValues)
        .enter()
        .append("rect")
            .attr("x", 775)
            .attr("y", function(d,i){ return 15 + i*(size1+5)})
            .attr("width", size1)
            .attr("height", size1)
            .style("fill", d=> colors(d))



    svg.selectAll("labels")
            .data(checkedValues)
            .enter()
            .append("text")
              .attr("x", 775 + size1*1.2)
              .attr("y", function(d,i){ return 15 + i*(size1+5) + (size1/2)}) 
              .text(d => d)
              .attr("text-anchor", "left")
              .style("alignment-baseline", "middle")


    /** Adding a legend **/



                /** Main Data Wrangling (starts here) **/

                final_array = [];
                selected_attribute_values_X = [];
                
                for(let i=0; i<universal_array.length; i++){
                    if(universal_array[i][attributeX] && universal_array[i][attributeSize] && (universal_array[i]['Year'] == year)){
                        let temp = {};
                        temp[attributeX] = universal_array[i][attributeX];
                        temp[attributeSize] = universal_array[i][attributeSize]
                        temp['Year'] = universal_array[i]['Year'];
                        temp['World bank region'] = universal_array[i]['World bank region'];
                        temp['Country'] = universal_array[i]['Country'];
                        selected_attribute_values_X.push(temp);
                    }
                }

                for(let i=0; i<selected_attribute_values_X.length; i++){
                    if(checkedValues.indexOf(selected_attribute_values_X[i]['World bank region']) != -1){
                        final_array.push(selected_attribute_values_X[i]);
                    }
                }

                /** Main Data Wrangling (ends here) **/

                /** Defining x-axis (starts here) **/

                let xValues = final_array.map(d => parseFloat(d[attributeX]));
                let xValues1 = [];
                let xValues2 = [];
                xValues1[0] = d3.min(xValues);
                xValues2[0] = d3.max(xValues);
                svg.selectAll("labels1").remove();
                svg.selectAll("labels1")
                .data(xValues1)
                .enter()
                .append("text")
                  .attr("x", 1000 + size1*1.2)
                  .attr("y", function(d,i){ return 15 + i*(size1+5) + (size1/2)}) 
                  .text(d => "Min size of scale: "+ d.toFixed(2))
                  .attr("text-anchor", "left")
                  .style("alignment-baseline", "middle")
                  svg.selectAll("labels2").remove();
                  svg.selectAll("labels2")
                  .data(xValues2)
                  .enter()
                  .append("text")
                    .attr("x", 1200 + size1*1.2)
                    .attr("y", function(d,i){ return 15 + i*(size1+5) + (size1/2)}) 
                    .text(d => "Max size of scale: "+ d.toFixed(2))
                    .attr("text-anchor", "left")
                    .style("alignment-baseline", "middle")

                let g = svg.append('g')
                        .attr('transform', `translate(${margin.left},${margin.top})`);

                const xScale = d3.scaleLinear()
                                .domain(d3.extent(xValues))
                                .range([0,chartWidth])

                if(document.getElementById('bottomAxis')){
                    d3.select('#bottomAxis').remove()
                }
                            
                g.append('g')
                    .attr('id','bottomAxis')
                    .attr('transform', `translate(0,${chartHeight})`)
                    .call(d3.axisBottom(xScale))
                    

                // svg.append

                /** Defining x-axis (ends here) **/

                /** The joins part (start here) **/
                let sizeDom = d3.extent(final_array.map((d) => parseFloat(d[attributeX])));
                let size = d3.scaleSqrt().domain(sizeDom).range([10,35]);

                let simulation = d3.forceSimulation(final_array)
                        .force('charge',d3.forceManyBody().strength(5))
                        .force('x', d3.forceX().x((d) =>{
                            return xScale(parseFloat(d[attributeX]))
                        }))
                        .force('y', d3.forceY().y((d) => {
                            return chartHeight/2;
                        }))
                        .force('collision', d3.forceCollide().radius((d) =>{
                            return size(d[attributeSize])
                        }))
                        .on('end', (d) =>{colors
                            svg.selectAll('circle')
                                .data(final_array, (d) => d.Country)

                                .join(
                                    enter => {
                                        const g = enter.append('g')
                                                        .attr('transform',`translate(${margin.left},${margin.top})`)
            
                                        enter.append('circle')
                                          .attr('cx', d => d.x)
                                          .attr('cy', d => d.y)
                                          .style('stroke', 'black')
                                          .style('fill', (d) => colors(d['World bank region']))
                                          .on('mouseover', (event,d) =>{
                                            let tooltip = d3.select('.tooltip')
                                            tooltip.style('display', 'block')
                                            .style('left', `${event.pageX + 10}px`)
                                            .style('top', `${event.pageY - 30}px`)
                                            .html(`<img src="data/flags/${d.Country.replace(/ /g, "-")}.png" alt="${d.Country} Flag" width="25" height="25"><strong>Country:</strong> ${d.Country}<br><strong>${attributeX}:</strong> ${d[attributeX]}<br><strong>${attributeSize}:</strong> ${d[attributeSize]}<br><strong>Year:</strong> ${d.Year}`)
                                          })
                                          .on('mouseout', () => {
                                            d3.select('.tooltip').style('display', 'none');
                                        })
                                         
            
                                        .call(enter => enter.transition()
                                                             .delay(2000)
                                                             .attr('r', d => size(d[attributeSize]))
                                        )
                                    },
                                    update => {

                                        update.selectAll('circle')     
                                        update.call(update => update.transition()
                                                                     .ease(d3.easeBounce)
                                                                     .duration(500)
                                                                    .delay((d,i) =>{
                                                                        if(i<=10){
                                                                            return 1000;
                                                                        } else if(i>10 & i<=20){
                                                                            return 1500;
                                                                        } else if(i>20 & i<30){
                                                                            return 1750;
                                                                        } else{
                                                                            return 1950;
                                                                        }
                                                                    })
                                                                     .attr('cx', d => d.x)
                                                                     .attr('cy', d => d.y)
                                                                     .attr('r', d => size(d[attributeSize]))

                                                        
                                        )
                                    },
                                    exit => {
                                        exit.selectAll('circle')
                                        exit.call(exit => exit.transition()
                                                              .delay(2000)
                                                              .attr('cx', 0)
                                                              .attr('cy', 0)
                                                              .attr('r', d => size(0))
 
                                        )
                                    }
                                );
                        })
                    

                /** The joins part (ends here) **/



            }

        }

    })

}

function increaseYear(){

    const currentState = d3.select('#playButton').attr('value');
    console.log(currentState)
    const updatedLabel = currentState == 'Play' ? 'Pause' : 'Play';
    d3.select('#playButton').attr('value', updatedLabel);

    playButtonClicked = true;

    checkIfButtonClicked();

}

function drawPlaySwarm(){
    
    const currentState = d3.select('#playButton').attr('value');

        if(currentState == 'Pause'){
            let yearForComp = parseInt(document.getElementById("year").value)
            while(yearForComp < 2013){

                console.log('loop run')

                let attributeX = document.getElementById("dropDownAttributeX-Axis").value;
                let attributeSize = document.getElementById("dropDownAttributeSize").value; 

                let checkedValues = []; 
                let checkedElements = document.getElementsByClassName('checkbox');
                for(let i=0; i<checkedElements.length;i++){
                    if(checkedElements[i].checked){
                        checkedValues.push(checkedElements[i].value);
                    }
                }

                    selected_attribute_values_X = [];
                    final_array = [];


                // let year = document.getElementById("year").value;
                let year = yearForComp + 1;
                if(attributeX == "None" || attributeSize == "None" || checkedValues.length == 0){
                    svg.selectAll("*").remove();
                }
                
                /** Main Data Wrangling (starts here) **/
                
                for(let i=0; i<universal_array.length; i++){
                    if(universal_array[i][attributeX] && universal_array[i][attributeSize] && (universal_array[i]['Year'] == year)){
                        let temp = {};
                        temp[attributeX] = universal_array[i][attributeX];
                        temp[attributeSize] = universal_array[i][attributeSize]
                        temp['Year'] = universal_array[i]['Year'];
                        temp['World bank region'] = universal_array[i]['World bank region'];
                        temp['Country'] = universal_array[i]['Country'];
                        selected_attribute_values_X.push(temp);
                    }
                }

                for(let i=0; i<selected_attribute_values_X.length; i++){
                    if(checkedValues.indexOf(selected_attribute_values_X[i]['World bank region']) != -1){
                        final_array.push(selected_attribute_values_X[i]);
                    }
                }

                /** Main Data Wrangling (ends here) **/
                console.log(final_array)
                plotBeeSwarm(checkedValues,attributeX,attributeSize,final_array);
                final_array = [];
                checkedValues = [];
                attributeX = "";
                attributeSize = "";
                selected_attribute_values_X = [];
                document.getElementById("year").value = yearForComp.toString();
                if(document.getElementById("year").value == '2012'){
                    document.getElementById("year").value = '2013';
                }
                yearForComp++;
            }
        } else if(currentState = 'Play'){

            let attributeX = document.getElementById("dropDownAttributeX-Axis").value;
            let attributeSize = document.getElementById("dropDownAttributeSize").value; 
            let year = document.getElementById("year").value;
    
        
    
            let checkedValues = []; 
            let checkedElements = document.getElementsByClassName('checkbox');
            for(let i=0; i<checkedElements.length;i++){
                if(checkedElements[i].checked){
                    checkedValues.push(checkedElements[i].value);
                }
            }

            if(attributeX == "None" || attributeSize == "None" || checkedValues.length == 0){
                svg.selectAll("*").remove();
            }

            final_array = [];
            selected_attribute_values_X = [];
            
            for(let i=0; i<universal_array.length; i++){
                if(universal_array[i][attributeX] && universal_array[i][attributeSize] && (universal_array[i]['Year'] == year)){
                    let temp = {};
                    temp[attributeX] = universal_array[i][attributeX];
                    temp[attributeSize] = universal_array[i][attributeSize]
                    temp['Year'] = universal_array[i]['Year'];
                    temp['World bank region'] = universal_array[i]['World bank region'];
                    temp['Country'] = universal_array[i]['Country'];
                    selected_attribute_values_X.push(temp);
                }
            }

            for(let i=0; i<selected_attribute_values_X.length; i++){
                if(checkedValues.indexOf(selected_attribute_values_X[i]['World bank region']) != -1){
                    final_array.push(selected_attribute_values_X[i]);
                }
            }

            plotBeeSwarm(checkedValues,attributeX,attributeSize,final_array)

        }
        
    
    // })

}

function plotBeeSwarm(checkedValues,attributeX,attributeSize,final_array){

        /** Adding a legend (starts here) **/


            let size1 = 10
            svg.selectAll("legend")
                .data(checkedValues)
                .enter()
                .append("rect")
                .attr("x", 775)
                .attr("y", function(d,i){ return 15 + i*(size1+5)})
                .attr("width", size1)
                .attr("height", size1)
                .style("fill", d=> colors(d))



             svg.selectAll("labels")
                .data(checkedValues)
                .enter()
                .append("text")
                .attr("x", 775 + size1*1.2)
                .attr("y", function(d,i){ return 15 + i*(size1+5) + (size1/2)}) 
                .text(d => d)
                .attr("text-anchor", "left")
                .style("alignment-baseline", "middle")


    /** Adding a legend (ends here) **/

                    /** Defining x-axis (starts here) **/

                let xValues = final_array.map(d => parseFloat(d[attributeX]));

                let g = svg.append('g')
                        .attr('transform', `translate(${margin.left},${margin.top})`);

                const xScale = d3.scaleLinear()
                                .domain(d3.extent(xValues))
                                .range([0,chartWidth])

                if(document.getElementById('bottomAxis')){
                    d3.select('#bottomAxis').remove()
                }
                            
                g.append('g')
                    .attr('id','bottomAxis')
                    .attr('transform', `translate(0,${chartHeight})`)
                    .call(d3.axisBottom(xScale))
                    

                /** Defining x-axis (ends here) **/

                                /** The joins part (start here) **/
                let sizeDom = d3.extent(final_array.map((d) => parseFloat(d[attributeX])));
                let size = d3.scaleSqrt().domain(sizeDom).range([10,40]);

                let simulation = d3.forceSimulation(final_array)
                        .force('charge',d3.forceManyBody().strength(5))
                        .force('x', d3.forceX().x((d) =>{
                            return xScale(parseFloat(d[attributeX]))
                        }))
                        .force('y', d3.forceY().y((d) => {
                            return chartHeight/2;
                        }))
                        .force('collision', d3.forceCollide().radius((d) =>{
                            return size(d[attributeSize])
                        }))
                        .on('end', (d) =>{colors
                            svg.selectAll('circle')
                                .data(final_array, (d) => d.Country)

                                .join(
                                    enter => {
                                        const g = enter.append('g')
                                                        .attr('transform',`translate(${margin.left},${margin.top})`)
            
                                        enter.append('circle')
                                          .attr('cx', d => d.x)
                                          .attr('cy', d => d.y)
                                          .style('stroke', 'black')
                                          .style('fill', (d) => colors(d['World bank region']))
                                          .on('mouseover', (event,d) =>{
                                            let tooltip = d3.select('.tooltip')
                                            tooltip.style('display', 'block')
                                            .style('left', `${event.pageX + 10}px`)
                                            .style('top', `${event.pageY - 30}px`)
                                            .html(`<strong>Country:</strong> ${d.Country}<br><strong>${attributeX}:</strong> ${d[attributeX]}<br><strong>${attributeSize}:</strong> ${d[attributeSize]}<br><strong>Year:</strong> ${d.Year}`)
                                          })
                                          .on('mouseout', () => {
                                            d3.select('.tooltip').style('display', 'none');
                                        })
                                         
            
                                        .call(enter => enter.transition()
                                                             .delay(4000)
                                                             .attr('r', d => size(d[attributeSize]))
                                        )
                                    },
                                    update => {

                                        update.selectAll('circle')

                                        // update.select('bottomAxis').remove()
                                              
                                        update.call(update => update.transition()
                                                                     .ease(d3.easeBounce)
                                                                     .duration(500)
                                                                    .delay((d,i) =>{
                                                                        if(i<=10){
                                                                            return 3000;
                                                                        } else if(i>10 & i<=20){
                                                                            return 3500;
                                                                        } else if(i>20 & i<30){
                                                                            return 3750;
                                                                        } else{
                                                                            return 3950;
                                                                        }
                                                                    })
                                                                     .attr('cx', d => d.x)
                                                                     .attr('cy', d => d.y)
                                                                     .attr('r', d => size(d[attributeSize]))

                                                        
                                        )
                                    },
                                    exit => {
                                        exit.selectAll('circle')
                                        exit.call(exit => exit.transition()
                                                              .delay(2000)
                                                              .attr('cx', 0)
                                                              .attr('cy', 0)
                                                              .attr('r', d => size(0))
                                        )
                                    }
                                );
                        })
                    
                /** The joins part (ends here) **/

}

/** JS For seleting all checkboxes (starts here) **/

let allBoxSelected = false;

function selectAll(){
    // let selectAll = document.getElementById('Select All');
    let options = document.getElementsByClassName('checkbox');
    if(allBoxSelected == true){
        allBoxSelected = false;
        for(let i=0; i<options.length; i++){
            if(options[i].type == 'checkbox'){
                options[i].checked = false;
            }
        }
    }else{
        allBoxSelected = true;
        for(let i=0; i<options.length; i++){
            console.log(options[i])
            if(options[i].type == 'checkbox'){
                options[i].checked = true;
            }
        }
    }

}

/** JS For seleting all checkboxes (ends here) **/

