/*
 * Source-bounded copy restored in correction pass 3.
 * Every sentence and every specification below was checked against the paired
 * NASA page. These entries intentionally do not reuse the longer legacy prose
 * in artifacts.js. URLs are exported separately so the dossier link always
 * opens the same mission-specific record used for its visible copy.
 */
export const FEATURED_SOURCES = {
  eagle: 'https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1969-059C',
  intrepid: 'https://www.nasa.gov/history/50-years-ago-return-to-the-moon/',
  antares: 'https://nssdc.gsfc.nasa.gov/nmc/spacecraft/display.action?id=1971-008C',
  falcon: 'https://www.nasa.gov/missions/apollo/apollo-15-mission-details/',
  challenger: 'https://www.nasa.gov/missions/apollo/apollo-17-mission-details/',
  surveyor3: 'https://science.nasa.gov/mission/surveyor-3/',
  lrrr: 'https://www.earthdata.nasa.gov/data/space-geodesy-techniques/slr/lunar-laser-ranging-data',
  odysseus: 'https://www.nasa.gov/missions/lro/nasas-lro-images-intuitive-machines-odysseus-lander/',
  sojourner: 'https://science.nasa.gov/mission/mars-pathfinder/',
  spirit: 'https://science.nasa.gov/mission/mars-exploration-rovers-spirit-and-opportunity/',
  opportunity: 'https://science.nasa.gov/mission/mer-opportunity/',
  viking1: 'https://science.nasa.gov/mission/viking/',
  phoenix: 'https://science.nasa.gov/mission/mars-phoenix/',
  insight: 'https://science.nasa.gov/mission/insight/',
  ingenuity: 'https://science.nasa.gov/mission/mars-2020-perseverance/ingenuity-mars-helicopter/',
  curiosity: 'https://science.nasa.gov/mission/msl-curiosity/',
  perseverance: 'https://science.nasa.gov/mission/mars-2020-perseverance/',
  voyager1: 'https://science.nasa.gov/mission/voyager/voyager-1/',
  voyager2: 'https://science.nasa.gov/mission/voyager/voyager-2/',
  pioneer10: 'https://science.nasa.gov/mission/pioneer-10/in-depth/',
  galileo: 'https://science.nasa.gov/mission/galileo/',
  cassini: 'https://science.nasa.gov/mission/cassini/',
};

export const FEATURED_AUDIT = {
  eagle: {
    summary: 'Apollo 11’s lunar module Eagle landed in the Sea of Tranquility on July 20, 1969. Its descent stage was the lower landing platform and remained on the Moon after the ascent stage lifted off.',
    specs: [['Landing', 'July 20, 1969'], ['Landing site', 'Sea of Tranquility'], ['Crew surface stay', '21 hours 36 minutes'], ['Descent-stage dry mass', '2,034 kg'], ['Role', 'Landing platform for ascent stage']],
    lat: .67408, lon: 23.47297, site: 'NASA catalogue location',
  },
  intrepid: {
    summary: 'Apollo 12 put Intrepid down in the Ocean of Storms in November 1969. The crew used the landing to reach Surveyor 3 and return selected parts for study on Earth.',
    specs: [['Landing', 'November 19, 1969'], ['Landing site', 'Ocean of Storms'], ['Surface stay', '31.5 hours'], ['Distance to Surveyor 3', 'About 160 m'], ['Surface work', 'Two EVAs and ALSEP deployment']],
    lat: -3.01239, lon: -23.42157, site: 'NASA catalogue location',
  },
  antares: {
    summary: 'Apollo 14’s Antares landed near Fra Mauro on February 5, 1971. Shepard and Mitchell completed two moonwalks, deployed experiments, and collected lunar samples before the ascent stage departed.',
    specs: [['Landing', 'February 5, 1971'], ['Landing site', 'Fra Mauro highlands'], ['Coordinates', '3.64589° S, 17.47194° W'], ['EVA time', '9 hours 23 minutes'], ['Samples', '42.28 kg']],
    lat: -3.64530, lon: -17.47136, site: 'NASA catalogue location',
  },
  falcon: {
    summary: 'Apollo 15’s Falcon landed at Hadley-Apennine on July 30, 1971. The mission used a Lunar Roving Vehicle to support exploration and surface science before Falcon’s ascent stage left the Moon.',
    specs: [['Landing', 'July 30, 1971'], ['Landing site', 'Hadley-Apennine'], ['Coordinates', '26.08° N, 3.66° E'], ['Surface stay', 'About 66 hours 55 minutes'], ['LRV traverse', '17.5 miles / 28.2 km']],
    lat: 26.13222, lon: 3.63386, site: 'NASA catalogue location',
  },
  challenger: {
    summary: 'Apollo 17’s Challenger landed in Taurus-Littrow on December 11, 1972. The crew completed three moonwalks with the Lunar Roving Vehicle and deployed surface experiments.',
    specs: [['Landing', 'December 11, 1972'], ['Landing site', 'Taurus-Littrow'], ['Coordinates', '20.16° N, 30.77° E'], ['EVA time', '22 hours 4 minutes'], ['LRV traverse', '30.5 km']],
    lat: 20.19080, lon: 30.77168, site: 'NASA catalogue location',
  },
  surveyor3: {
    summary: 'Surveyor 3 landed in Oceanus Procellarum on April 20, 1967 and sent television pictures of its surroundings. Its surface sampler dug trenches and performed soil tests that informed lunar-surface planning.',
    specs: [['Landing', 'April 20, 1967'], ['Landing site', 'Oceanus Procellarum'], ['Coordinates', '3° S, 23.41° W'], ['TV pictures', '6,326'], ['Last contact', 'May 4, 1967']],
    lat: -3.015, lon: -23.418, site: 'NASA Surveyor 3 location',
  },
  lrrr: {
    summary: 'Lunar laser ranging uses retroreflectors placed by Apollo and Lunokhod missions from 1969 through 1973. A subset of the global laser-ranging network continues to track the arrays for studies of the Earth-Moon system.',
    specs: [['Deployment era', '1969–1973'], ['Apollo arrays', 'Apollo 11, 14, and 15'], ['Apollo 11 array', '100 fused-silica corner cubes'], ['Apollo 15 array', '300 corner cubes'], ['Data archive', 'NASA LLR data dates to 1969']],
  },
  odysseus: {
    summary: 'Odysseus softly landed near Malapert A in the lunar south-pole region on February 22, 2024. NASA’s Lunar Reconnaissance Orbiter photographed the lander two days later and reported its location.',
    specs: [['Landing', 'February 22, 2024'], ['Landing site', 'Near Malapert A'], ['Coordinates', '80.13° S, 1.44° E'], ['LRO image date', 'February 24, 2024'], ['Local terrain slope', '12 degrees']],
    lat: -80.13, lon: 1.44, site: 'NASA LRO-reported location',
  },
  sojourner: {
    summary: 'Mars Pathfinder landed at Ares Vallis on July 4, 1997 and deployed the Sojourner rover. The lander and 10.6-kilogram rover returned images, rock and soil analyses, and weather data before their final transmission.',
    specs: [['Landing', 'July 4, 1997'], ['Landing site', 'Ares Vallis'], ['Sojourner mass', '10.6 kg'], ['Final transmission', 'September 27, 1997'], ['Rover images', 'More than 550']],
    lat: 19.13, lon: -33.22, site: 'Ares Vallis',
  },
  spirit: {
    summary: 'Spirit landed in Gusev Crater in January 2004 to investigate evidence of past water. It sent its final communication in March 2010 after traveling 7.73 kilometers and returning more than 124,000 images.',
    specs: [['Landing', 'January 3, 2004'], ['Landing site', 'Gusev Crater'], ['Final communication', 'March 22, 2010'], ['Distance driven', '7.73 km'], ['Images returned', 'More than 124,000']],
    lat: -14.569, lon: 175.478, site: 'Gusev Crater',
  },
  opportunity: {
    summary: 'Opportunity landed on Mars in January 2004 to study places that may once have supported life. It last communicated during a global dust storm in June 2018 after driving 45.16 kilometers.',
    specs: [['Landing', 'January 24, 2004'], ['Landing site', 'Meridiani Planum'], ['Last communication', 'June 10, 2018'], ['Distance driven', '45.16 km'], ['Planned mission', '90 sols']],
    lat: -1.946, lon: -5.527, site: 'Meridiani Planum',
  },
  viking1: {
    summary: 'Viking 1 landed in Chryse Planitia on July 20, 1976 as part of NASA’s two-spacecraft Viking mission. Its lander returned images and investigated Martian soil and atmosphere until its final transmission in 1982.',
    specs: [['Landing', 'July 20, 1976'], ['Landing site', 'Chryse Planitia'], ['Coordinates', '22.27° N, 312.05° E'], ['Mission design', 'Orbiter and lander'], ['Final transmission', 'November 11, 1982']],
    lat: 22.480, lon: -49.967, site: 'Chryse Planitia',
  },
  phoenix: {
    summary: 'Phoenix landed on the arctic plains of Mars on May 25, 2008 to study the history of water and look for complex organic molecules. Its robotic arm and onboard laboratory examined soil and ice before the mission ended that November.',
    specs: [['Landing', 'May 25, 2008'], ['Landing site', 'Vastitas Borealis'], ['End of mission', 'November 2, 2008'], ['Landing coordinates', '68.22° N, 234.25° E'], ['Robotic arm', '2.5 m']],
    lat: 68.22, lon: -125.75, site: 'Vastitas Borealis',
  },
  insight: {
    summary: 'InSight landed in Elysium Planitia on November 26, 2018 to study the deep interior of Mars. Its arm placed a seismometer and heat-flow probe on the surface before the mission ended in December 2022.',
    specs: [['Landing', 'November 26, 2018'], ['Landing site', 'Elysium Planitia'], ['End of mission', 'December 15, 2022'], ['Landing area', 'About 4.5° N, 135.9° E'], ['Robotic arm', '1.8 m']],
    lat: 4.502, lon: 135.623, site: 'Elysium Planitia',
  },
  ingenuity: {
    summary: 'Ingenuity completed 72 flights at Jezero Crater after beginning flight operations in April 2021. NASA ended the mission in January 2024 after damage to one or more rotor blades made further flight unsafe.',
    specs: [['First flight', 'April 19, 2021'], ['Last flight', 'January 18, 2024'], ['Mission end', 'January 25, 2024'], ['Flights', '72'], ['Distance flown', 'About 17 km']],
    lat: 18.44, lon: 77.45, site: 'Jezero Crater',
  },
  curiosity: {
    summary: 'Curiosity landed in Gale Crater in August 2012 to assess whether Mars ever had environments capable of supporting microbial life. The rover studies rock, soil, and air samples with an onboard suite of instruments.',
    specs: [['Launch', 'November 26, 2011'], ['Landing', 'August 5, 2012 PDT'], ['Landing site', 'Gale Crater'], ['Mass', '899 kg'], ['Science instruments', '10']],
    lat: -4.59, lon: 137.44, site: 'Gale Crater',
  },
  perseverance: {
    summary: 'Perseverance landed at Jezero Crater on February 18, 2021 to seek signs of ancient life and collect rock and regolith samples. NASA reports it had driven 45.22 kilometers as of October 11, 2026.',
    specs: [['Launch', 'July 30, 2020'], ['Landing', 'February 18, 2021'], ['Landing site', 'Jezero Crater'], ['Objective', 'Collect rock and regolith samples'], ['Distance snapshot', '45.22 km · October 11, 2026']],
    lat: 18.44, lon: 77.45, site: 'Jezero Crater',
  },
  voyager1: {
    summary: 'Voyager 1 launched in 1977 to fly by Jupiter and Saturn and entered interstellar space in August 2012. NASA’s current mission status page continues to publish its distance snapshot and instrument status.',
    specs: [['Launch', 'September 5, 1977'], ['Jupiter flyby', 'March 5, 1979'], ['Saturn flyby', 'November 12, 1980'], ['Interstellar space', 'August 25, 2012'], ['Distance snapshot', '173.05362265 AU · November 12, 2026']],
  },
  voyager2: {
    summary: 'Voyager 2 launched in 1977 and completed close flybys of Jupiter, Saturn, Uranus, and Neptune. It entered interstellar space in November 2018; NASA’s status page publishes a dated distance snapshot.',
    specs: [['Launch', 'August 20, 1977'], ['Uranus flyby', 'January 24, 1986'], ['Neptune flyby', 'August 25, 1989'], ['Interstellar space', 'November 25, 2018'], ['Distance snapshot', '144.83334845 AU · November 12, 2026']],
  },
  pioneer10: {
    summary: 'Pioneer 10 launched in 1972 to investigate Jupiter, its satellites, magnetic field, and radiation belts. It crossed the asteroid belt, flew past Jupiter in 1973, and continued collecting data into the outer solar system.',
    specs: [['Launch', 'March 2, 1972'], ['Asteroid-belt exit', 'February 15, 1973'], ['Jupiter closest approach', 'December 4, 1973'], ['Closest-approach range', '130,354 km'], ['Final signal', 'January 23, 2003']],
  },
  galileo: {
    summary: 'Galileo began orbiting Jupiter in December 1995 after launching in 1989. NASA deliberately ended the mission in Jupiter’s atmosphere in September 2003 to avoid a later impact with Europa.',
    specs: [['Launch', 'October 18, 1989'], ['Jupiter orbit', 'December 1995'], ['Major-moon encounters', '35'], ['Atmospheric probe', 'December 7, 1995'], ['Mission end', 'September 21, 2003']],
  },
  cassini: {
    summary: 'Cassini explored Saturn and its moons from orbit for 13 years. In 2017, NASA directed the spacecraft through 22 final orbits between Saturn and its rings before its planned atmospheric entry.',
    specs: [['Launch', 'October 15, 1997'], ['Saturn orbit', '13 years'], ['Grand Finale start', 'April 2017'], ['Final orbits', '22'], ['Atmospheric entry', 'September 15, 2017']],
  },
};
