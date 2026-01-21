// Type declarations for hijri-date library
declare module 'hijri-date' {
  class HijriDate {
    constructor(year: number, month: number, day: number);
    constructor(date: Date);

    getFullYear(): number;
    getMonth(): number;
    getDate(): number;

    toGregorian(): Date;

    static fromGregorian(date: Date): HijriDate;
  }

  export = HijriDate;
}
