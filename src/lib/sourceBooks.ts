/** 演示书源的内置书目（均为公版文本） */
export interface SourceBook {
  sourceName: string;
  title: string;
  author: string;
  intro: string;
  content: string;
}

export const SOURCE_BOOKS: SourceBook[] = [
  {
    sourceName: "公版书库",
    title: "记承天寺夜游",
    author: "苏轼",
    intro: "月色入户，欣然起行",
    content: `元丰六年十月十二日夜，解衣欲睡，月色入户，欣然起行。念无与为乐者，遂至承天寺寻张怀民。

怀民亦未寝，相与步于中庭。

庭下如积水空明，水中藻、荇交横，盖竹柏影也。

何夜无月？何处无竹柏？但少闲人如吾两人者耳。`,
  },
  {
    sourceName: "公版书库",
    title: "将进酒",
    author: "李白",
    intro: "君不见黄河之水天上来",
    content: `君不见黄河之水天上来，奔流到海不复回。
君不见高堂明镜悲白发，朝如青丝暮成雪。

人生得意须尽欢，莫使金樽空对月。
天生我材必有用，千金散尽还复来。
烹羊宰牛且为乐，会须一饮三百杯。

岑夫子，丹丘生，将进酒，杯莫停。
与君歌一曲，请君为我倾耳听。

钟鼓馔玉不足贵，但愿长醉不愿醒。
古来圣贤皆寂寞，惟有饮者留其名。

陈王昔时宴平乐，斗酒十千恣欢谑。
主人何为言少钱，径须沽取对君酌。

五花马，千金裘，
呼儿将出换美酒，与尔同销万古愁。`,
  },
];
