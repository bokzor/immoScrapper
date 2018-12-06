import { Scraper } from '../Scraper.observable';
import { concat } from 'rxjs';

export class ImmowebScrapper {

  readonly actionType = {
    'a-louer': ['appartement', 'maison', 'immeuble-de-rapport'],
    'a-vendre': ['appartement', 'maison']
  };

  readonly regionsOfInterest = [4000, 4020];

  private readonly minRoom = 2;
  private readonly maxRoom = 3;

  readonly areaRegex = /(\d+) m/;
  readonly roomRegex = /(\d) ch/;
  readonly priceRegex = /[0-9]{1,3}(,[0-9]{3})*\.?[0-9]+/;

  go() {
    const observable = [];
    for (const region of this.regionsOfInterest) {
      for (const action of Object.keys(this.actionType)) {
        for (const type of this.actionType[action]) {
          const url = `https://www.immoweb.be/fr/recherche/${type}/${action}?zips=${region}&minroom=${this.minRoom}&maxroom=${this.maxRoom}`;
          observable.push(this.getSraper(url));
        }
      }
    }
    concat(observable).subscribe((result) => {
      console.log(result);
      // const price = this.findValue(this.priceRegex, result['price']);
      // const area = this.findValue(this.areaRegex, result['area']);
      // const room = this.findValue(this.roomRegex, result['area']);
      // console.log(price, area, room);
    })
  }

  findValue(regex: RegExp, value: string) {
    if (value) {
      const result = value.match(regex);
      return result[0];
    }
  }

  getSraper(url: string) {
    return new Scraper().i(
      url,
      '#result',
      '.result-xl, .result-l, .result-m',
      new Map([
        ['area', '.xl-surface-ch, .l-surface-ch, .m-surface-ch'],
        ['price', '.xl-price, .l-price, .m-price'],
        ['id', '@id']
      ]))
      .paginate('.next@href')
      .limitByItem(100)
      .go();
  }

}




