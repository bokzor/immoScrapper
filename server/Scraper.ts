import { Observable, Subject } from 'rxjs';
import { AxiosResponse, AxiosStatic } from 'axios';

const axios: AxiosStatic = require('axios');
const cheerio = require('cheerio');

const isNullOrEmpty = (toCheck: string) => {
  return !toCheck || toCheck === '';
};

const debug = (log: string, ...params: any[]) => {
  console.log(log, ...params);
};

export class Scraper {
  public currentPage = 0;
  public nbItems = 0;
  public limitPage: number;
  private limitItem: number;
  private url: string;
  private mainWrapperSelector: string;
  private itemsSelector: string;
  private infosToFetch: Map<string, string>;
  private nextPageSelector: string;
  private items$ = new Subject();

  private static getAttrValue(elem: Cheerio, selector: string, attr: string) {
    switch (attr) {
      case 'html':
        return elem.find(selector).html();
      default:
        return !isNullOrEmpty(selector) ? elem.find(selector).attr(attr) : elem.children().attr(attr);
    }
  }

  private static getSelectorValue(elem: Cheerio, enhancedSelector: string): string {
    const [selector, attr] = enhancedSelector.split('@');
    if (isNullOrEmpty(selector) && isNullOrEmpty(attr)) {
      return elem.find(enhancedSelector).text();
    }
    return attr ? Scraper.getAttrValue(elem, selector, attr) : elem.find(selector).text();
  }

  i(url: string, wrapperSelector: string, itemsSelector: string, itemDetails: Map<string, string>) {
    this.url = url;
    this.mainWrapperSelector = wrapperSelector;
    this.itemsSelector = itemsSelector;
    this.infosToFetch = itemDetails;
    return this;
  }

  paginate(nextPageSelector: string) {
    this.nextPageSelector = nextPageSelector;
    return this;
  }

  limitByPage(limit: number) {
    this.limitPage = limit;
    return this;
  }

  limitByItem(limit: number) {
    this.limitItem = limit;
    return this;
  }

  go(): Observable<any> {
    this.goToNextPage(this.url);
    return this.items$;
  }

  private handleHtml(html: string) {
    const $: CheerioStatic = cheerio.load(html);
    const wrapper = $.root().find(this.mainWrapperSelector);
    const items = wrapper.find(this.itemsSelector).toArray();
    if (items.length === 0) {
      debug('No element found for page %d', this.currentPage);
    }
    this.parseItems(items);
    const nextUrl = Scraper.getSelectorValue($.root(), this.nextPageSelector);
    if (nextUrl) {
      this.goToNextPage(nextUrl);
    } else {
      this.items$.complete();
    }
  }

  private parseItems(items: CheerioElement[]) {
    const result = {};
    for (const item of items) {
      this.infosToFetch.forEach((selector, propertyName) => {
        result[propertyName] = Scraper.getSelectorValue(cheerio.load(item).root(), selector);
      });
      this.emitItem(result);
    }
  }

  private emitItem(result: any) {
    if (this.limitItem && this.nbItems >= this.limitItem) {
      debug('This limit (%d) of items has been reached', this.limitItem);
      return this.items$.complete();
    }
    this.nbItems++;
    debug('Item %d : PUBLISH', this.nbItems);
    this.items$.next(result);
  }

  private goToNextPage(nextUrl: string) {
    if (this.limitPage && this.currentPage >= this.limitPage) {
      debug('This limit (%d) of page has been reached', this.currentPage);
      return this.items$.complete();
    }

    this.currentPage++;
    debug('Page %d : FETCHING', this.currentPage);
    axios.get(nextUrl)
      .then((response: AxiosResponse) => {
        debug('Page %d : SUCCESS', this.currentPage);
        this.handleHtml(response.data);
      });
  }
}
