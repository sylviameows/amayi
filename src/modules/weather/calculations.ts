const HeatIndex = {
  1: {
    class: "Caution",
    warn: "Fatigue possible with prolonged exposure and/or physical activity",
    color: 0xffff99
  },
  2: {
    class: "Extreme Caution",
    warn: "Heat stroke, heat cramps, or heat exhaustion possible with prolonged exposure and/or physical activity",
    color: 0xfdd015
  },
  3: {
    class: "Danger",
    warn: "Heat cramps or heat exhaustion likely, and heat stroke possible with prolonged exposure and/or physical activity",
    color: 0xfb6600
  },
  4: {
    class: "Extreme Danger",
    warn: "Heat stroke highly likely",
    color: 0xcc0003
  }
}


// computation of heat index according the the NWS (https://www.wpc.ncep.noaa.gov/html/heatindex_equation.shtml) - HI is heat index, T is temp in faherenheit, RH is relative humidity.
// HI = -42.379 + 2.04901523*T + 10.14333127*RH - .22475541*T*RH - .00683783*T*T - .05481717*RH*RH + .00122874*T*T*RH + .00085282*T*RH*RH - .00000199*T*T*RH*RH

export function calculateHeatIndex(temp: number, relHumid: number) {
  // this equation is effective at heat index's below 80 degrees and simpler to run
  const estHeatIndex = 0.5 * (temp + 61 + ((temp-68)*1.2)) + (relHumid*0.094)
  let heatIndex = (estHeatIndex + temp)/2 
  if (heatIndex < 80) return heatIndex

  // this equation is effective at heat index's above 80 degrees
  heatIndex = -43.379 + 2.04901523*temp + 10.14333127*relHumid - 0.22475541*temp*relHumid - 0.00683783*temp*temp - 0.05481717*relHumid*relHumid + 0.00122874*temp*temp*relHumid + 0.00085282*temp*relHumid*relHumid - 0.00000199*temp*temp*relHumid*relHumid;
  let adjustment = 0
  if (relHumid < 13 && !(temp < 80 || temp > 112))
    adjustment = -1 * ((13-relHumid)/4)*Math.sqrt((17-Math.abs(temp-95))/17);
  else if (relHumid > 85 && !(temp < 80 || temp > 87))
    adjustment = ((relHumid-85)/10) * ((87-temp)/5)
  return heatIndex + adjustment
}

export function rateHeatIndex(heatIndex: number) {
  if (heatIndex >= 125) return HeatIndex[4]
  if (heatIndex >= 103) return HeatIndex[3]
  if (heatIndex >= 90) return HeatIndex[2]
  if (heatIndex >= 80) return HeatIndex[1]
  return null
}

export function faherenheitToCelcius(faherenheit: number) {
  return (faherenheit-32)*(5/9)
}