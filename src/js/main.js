import {worldChoropleth} from "./worldChoropleth.js";
import {indonesiaChoropleth} from "./indonesiaChoropleth.js";

const path = "src/assets";
const jsonPath = `${path}/json`;
const dataPath = `${path}/data`;

console.log(dataPath);

worldChoropleth("world-choropleth", `${jsonPath}/world.json`, `${dataPath}/overseas.csv`);
indonesiaChoropleth("indonesia-choropleth", `${jsonPath}/indonesia.json`, `${dataPath}/national.csv`);

console.log("Please let me know if the site isn't working properly thank you! - H");