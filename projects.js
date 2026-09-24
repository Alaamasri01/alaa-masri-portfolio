/*
 * Project collections.
 * Order here defines the project numbering and the previous / next sequence
 * in the project viewer. Keep it in step with the cards in index.html.
 * Each image: [file, alt text]. The first image is the project's hero view.
 */
(function () {
  'use strict';

  var data = [
    {
      slug: 'burgundy-salon',
      title: 'The burgundy salon',
      category: 'Residential / Living',
      description: 'A double-height salon defined by burgundy seating, tall windows and fine architectural detailing.',
      images: [
        ['burgundy-salon-01.webp', 'Double-height salon with a curved burgundy sofa, full-height glazing and a burgundy feature wall.'],
        ['burgundy-salon-02.webp', 'The salon from a lower angle, showing the sculptural pendant, burgundy wall panel and gallery level above.'],
        ['burgundy-salon-03.webp', 'Close view of the burgundy velvet seating in afternoon light.']
      ]
    },
    {
      slug: 'arched-retreat',
      title: 'An arched retreat',
      category: 'Hospitality / Design study',
      description: 'A hospitality design study connecting vaulted interiors, dining spaces, guest accommodation and quiet leisure areas.',
      images: [
        ['arched-retreat-01.webp', 'Arched reception hall with a stone-clad counter, gold chandelier and polished marble floor.'],
        ['arched-retreat-02.webp', 'Guest suite set beneath tall arches, with a lounge area and city views.'],
        ['arched-retreat-03.webp', 'All-day dining space with timber tables, a central bar and arched stone walls.'],
        ['arched-retreat-04.webp', 'Banquet hall laid for an event beneath chandeliers and tall arched windows at dusk.'],
        ['arched-retreat-05.webp', 'Indoor pool framed by illuminated arched niches and stone columns.'],
        ['arched-retreat-06.webp', 'Rooftop lounge beneath an arched loggia, overlooking the city skyline at sunset.'],
        ['arched-retreat-07.webp', 'Guest bedroom with arched windows, a stone feature wall and integrated cove lighting.']
      ]
    },
    {
      slug: 'walnut-suite',
      title: 'The walnut suite',
      category: 'Residential / Bedroom',
      description: 'Rich walnut, burgundy accents and integrated lighting connect the bedroom and its bespoke joinery.',
      images: [
        ['walnut-suite-01.webp', 'Symmetrical bedroom with an upholstered burgundy headboard wall, walnut panelling and a glass pendant.'],
        ['walnut-suite-02.webp', 'Opposite wall of the suite: a walnut media unit with lit shelving and a stone ledge.'],
        ['walnut-suite-03.webp', 'Detail of the walnut joinery, integrated shelving and concealed linear lighting.'],
        ['walnut-suite-04.webp', 'Bedside detail with a marble side table, lamp and burgundy upholstered panels.'],
        ['walnut-suite-05.webp', 'Material detail where burgundy velvet meets walnut and a lit reveal.']
      ]
    },
    {
      slug: 'illuminated-villa',
      title: 'The illuminated villa',
      category: 'Architecture / Exterior',
      description: 'A contemporary villa study exploring stone, vertical screening and architectural lighting from day to dusk.',
      images: [
        ['illuminated-villa-01.webp', 'Aerial view of a contemporary stone villa with landscaped courtyards and warm facade lighting.'],
        ['illuminated-villa-02.webp', 'The villa facade at dusk, showing cantilevered volumes, vertical screens and linear lighting.'],
        ['illuminated-villa-03.webp', 'Entrance canopy with a timber door, stone cladding and lit planting.'],
        ['illuminated-villa-04.webp', 'Detail of vertical timber screening and concealed lighting along the parapet.'],
        ['illuminated-villa-05.webp', 'The villa in daylight: stone volumes, timber screens and a recessed entrance.']
      ]
    },
    {
      slug: 'garden-lounge',
      title: 'Living by the garden',
      category: 'Residential / Living',
      description: 'A warm family living and dining space with garden views, textured fabrics and a linear fireplace.',
      images: [
        ['garden-lounge-01.webp', 'Open-plan living and dining space with a linear fireplace, timber wall and garden views.'],
        ['garden-lounge-02.webp', 'Timber dining table beneath a skylight, with palm-lined garden views at sunset.'],
        ['garden-lounge-03.webp', 'Linear fireplace set into a textured stone wall with timber slats.'],
        ['garden-lounge-04.webp', 'Coffee table styling with ceramics and books in warm evening light.'],
        ['garden-lounge-05.webp', 'Boucle lounge chair and cushion in the corner of the living room.']
      ]
    },
    {
      slug: 'skyline-suite',
      title: 'The skyline suite',
      category: 'Residential / Bedroom',
      description: 'A timber-lined bedroom with skyline views, illuminated wardrobes and coordinated material details.',
      images: [
        ['skyline-suite-01.webp', 'Timber-lined bedroom with floor-to-ceiling windows overlooking a city skyline at night.'],
        ['skyline-suite-02.webp', 'The bedroom looking towards the illuminated glass-fronted wardrobes.'],
        ['skyline-suite-03.webp', 'Bed detail with layered linens and an upholstered headboard.'],
        ['skyline-suite-04.webp', 'Illuminated walk-in wardrobe with glass doors and walnut frames.'],
        ['skyline-suite-05.webp', 'Brass and glass pendant light against timber panelling.'],
        ['skyline-suite-06.webp', 'Material palette board for the suite: wall panelling, flooring, bedding, curtains, rug and leather samples.']
      ]
    },
    {
      slug: 'earth-toned-majlis',
      title: 'An earthy welcome',
      category: 'Residential / Majlis',
      description: 'Soft neutral seating, warm timber and patterned walls create a generous space for gathering.',
      images: [
        ['earth-toned-majlis-01.webp', 'Majlis with low perimeter seating, a patterned frieze and a softly lit plaster feature wall.'],
        ['earth-toned-majlis-02.webp', 'Seating detail showing terracotta cushions and the patterned wall frieze.'],
        ['earth-toned-majlis-03.webp', 'Lit timber shelving with sculptural ceramic vessels beside the patterned frieze.'],
        ['earth-toned-majlis-04.webp', 'Sculptural terracotta object on a side table in front of the seating.'],
        ['earth-toned-majlis-05.webp', 'Close view of the neutral seating and layered cushions.']
      ]
    }
  ];

  var byslug = {};
  data.forEach(function (project, i) {
    project.index = i;
    project.images = project.images.map(function (img) {
      return { href: 'projects/' + img[0], alt: img[1] };
    });
    byslug[project.slug] = project;
  });

  window.portfolioProjectOrder = data;
  window.portfolioProjects = byslug;
})();
