import { EMPTY, Observable, Subscriber } from 'rxjs';
import { concatMap, expand, map, tap } from 'rxjs/operators';
import { AxiosStatic } from 'axios';
import { debug } from './utils';
import { ajax, AjaxResponse } from 'rxjs/internal-compatibility';


const isNullOrEmpty = (toCheck: string) => {
  return !toCheck || toCheck === '';
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
  private items$: Subscriber<any>;

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


  get(url: string): any {
    return ajax.get(url).pipe(
      map((response: AjaxResponse) => cheerio.load(response.response)),
      map($ => ({
        content: $,
        next: Scraper.getSelectorValue($.root(), this.nextPageSelector)
      })),
      expand(({ next }) => next ? this.get(next) : EMPTY),
      concatMap(({ content }) => content),
      tap((content) => {
        console.log(content);
      })

    );
  }


  go(): Observable<any> {

    return this.get(this.url);
    /*
        const subject = new BehaviorSubject(this.url);
        subject.pipe(
          mergeMap((url: string) => {
            console.log(url);
            return fromPromise(axios.get(url));
          }),
          map((response: AxiosResponse) => cheerio.load(response.data)),
          map(($) => {
            const wrapper = $.root().find(this.mainWrapperSelector);
            const nextUrl = Scraper.getSelectorValue($.root(), this.nextPageSelector);
            if (nextUrl)
              subject.next(nextUrl);
            return wrapper.find(this.itemsSelector).toArray();
          }),
          takeWhile(items => items.length > 0),
          map(this.parseItems),
          startWith([]),
          scan((acc: [], currentPageEntities) =>
            acc.concat(currentPageEntities)
          )
        );
        return subject;
        */
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

}






