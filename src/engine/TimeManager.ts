import type { GameTime } from '../types/state';

const CN_MONTH = ['正', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二'];
const CN_DAY = ['初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十'];

export class TimeManager {
  private time: GameTime;
  private onIsland: boolean = false;

  constructor(initialTime: GameTime) {
    this.time = { ...initialTime };
  }

  getDate(): string {
    return this.time.date;
  }

  getTime(): Readonly<GameTime> {
    return this.time;
  }

  setOnIsland(onIsland: boolean): void {
    this.onIsland = onIsland;
    this.recalcSeason();
  }

  advanceTo(date: string): void {
    this.time.date = date;
    this.recalcSeason();
  }

  advanceDays(days: number): void {
    const d = new Date(this.time.date);
    d.setDate(d.getDate() + days);
    this.time.date = d.toISOString().slice(0, 10);
    this.recalcSeason();
  }

  setDate(date: string): void {
    this.time.date = date;
    this.recalcSeason();
  }

  reset(time: GameTime): void {
    this.time = { ...time };
    this.onIsland = false;
    this.recalcSeason();
  }

  isSeptemberFirst(): boolean {
    const [, month, day] = this.time.date.split('-').map(Number);
    return month === 9 && day === 1;
  }

  formatDate(): string {
    const [year, month, day] = this.time.date.split('-').map(Number);
    return `${year}年${CN_MONTH[month - 1]}月${CN_DAY[day - 1]}`;
  }

  private recalcSeason(): void {
    if (!this.onIsland) {
      this.time.season = '旱季';
      return;
    }
    const [, month] = this.time.date.split('-').map(Number);
    // 加勒比地区大致：5-11月雨季，12-4月旱季
    this.time.season = (month >= 5 && month <= 11) ? '雨季' : '旱季';
  }
}
