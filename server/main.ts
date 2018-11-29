import { Scraper } from './Scraper';


class ImmowebScrapper {

  toRent = ['appartement', 'maison', 'immeuble-de-rapport'];
  toBuy = ['appartement', 'maison'];

  regionsOfInterest = [4000, 4020];

  minRoom = 2;
  maxRoom = 3;

  spaceRegex = /(\d+) m/;
  roomRegex = /(\d) ch/;
  priceRegex = /[0-9]{1,3}(,[0-9]{3})*\.?[0-9]+/;


}

const scraper$ = new Scraper().i(
  'https://www.immoweb.be/fr/recherche/maison/a-vendre//liege/4000?minroom=2&maxroom=3',
  '#result',
  '.result-xl, .result-l, .result-m',
  new Map([
    ['surface', '.xl-surface-ch, .l-surface-ch, .m-surface-ch'],
    ['prix', '.xl-price, .l-price, .m-price'],
    ['id', '@id']
  ]))
  .paginate('.next@href')
  .limitByItem(100)
  .go();

scraper$.subscribe((item) => {
  console.log('price :');
});

