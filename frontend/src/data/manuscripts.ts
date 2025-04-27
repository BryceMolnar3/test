export interface Manuscript {
  ms_id: string;
  sigla: string;
  other_names: string;
  total_folia: number;
  laod_folia: string;
  dimensions: string;
  place_of_origin: string;
  materials: string;
  format_description: string;
  date: string;
  image_src: string;
  verses: {
    verse_number: number;
    verse_text: string;
  }[];
}

export const manuscripts: { [sigla: string]: Manuscript } = {
  "01": {
    ms_id: "Fulda, Hochschul- und Landesbibliothek, Bonifatianus 1",
    sigla: "01",
    other_names: "Codex Fuldensis",
    total_folia: 1018,
    laod_folia: "316v-317v",
    dimensions: "15×6×5 in",
    place_of_origin: "Capua, Northern Italy",
    materials: "Parchment",
    format_description: "Single Column",
    date: "541-546",
    image_src: "/images/manuscript-image.png",
    verses: [
      {
        verse_number: 1,
        verse_text: "Paulus apostolus non ab hominibus neque per hominem sed per ihesum christum fratribus qui sunt laodiciae."
      },
      {
        verse_number: 2,
        verse_text: "Gratia vobis et pax a deo patre et domino ihesu christo."
      },
      {
        verse_number: 3,
        verse_text: "Gratias ago christo per omnem orationem meam quod permanentes estis in eo et perseverantes in operibus eius promissum expectantes in diem iudicii."
      },
      {
        verse_number: 4,
        verse_text: "Neque destituant vos quorundam vaniloquia insinuantium ut vos evertant a veritate evangelii quod a me praedicatur."
      },
      {
        verse_number: 5,
        verse_text: "Et nunc faciet deus ut qui sunt ex me ad profectum veritatis evangelii deservientes et facientes benignitatem operum salutis vitae aeternae."
      },
      {
        verse_number: 6,
        verse_text: "Et nunc palam sunt vincula mea quae patior in christo in quibus laetor et gaudeo."
      },
      {
        verse_number: 7,
        verse_text: "Et hoc mihi est ad salutem perpetuam quod factum orationibus vestris et administrante spiritu sancto sive per vitam sive per mortem."
      },
      {
        verse_number: 8,
        verse_text: "Est enim mihi vivere in christo et mori gaudium."
      },
      {
        verse_number: 9,
        verse_text: "Et ipse in vobis faciet misericordiam suam ut eandem dilectionem habeatis et sitis unanimes."
      },
      {
        verse_number: 10,
        verse_text: "Ergo dilectissimi ut audistis praesentiam meam ita retinete et facite in timore dei et erit vobis vita aeterna."
      },
      {
        verse_number: 11,
        verse_text: "Est enim deus qui operatur in vobis."
      },
      {
        verse_number: 12,
        verse_text: "Et facite sine retractione quaecumque facitis."
      },
      {
        verse_number: 13,
        verse_text: "Et quod optimum est dilectissimi gaudete in christo et cavete sordidos in lucro."
      },
      {
        verse_number: 14,
        verse_text: "Omnes petitiones vestrae innotescant apud deum et estote firmi in sensu christi."
      },
      {
        verse_number: 15,
        verse_text: "Et quaecumque sunt vera quaecumque pudica quaecumque iusta quaecumque amabilia haec facite."
      },
      {
        verse_number: 16,
        verse_text: "Et quae audistis et accepistis haec in corde retinete et erit vobis pax."
      },
      {
        verse_number: 17,
        verse_text: "Salutant vos sancti omnes."
      },
      {
        verse_number: 18,
        verse_text: "Gratia domini nostri ihesu christi cum spiritu vestro."
      },
      {
        verse_number: 19,
        verse_text: "Et facite ut in ecclesia laodicensium legatur."
      }
    ]
  },
  "02": {
      ms_id: "Vatican Library, Codex Vaticanus",
      sigla: "02", 
      other_names: "Codex B",
      total_folia: 759,
      laod_folia: "214r-215v",
      dimensions: "27×27 cm",
      place_of_origin: "Rome, Italy",
      materials: "Vellum",
      format_description: "Three Columns",
      date: "325-350",
      image_src: "/images/manuscript-image3.png",
      verses: [
        {
          verse_number: 1,
          verse_text: "Paulus apostolus non per homines neque per hominem sed per ihesum christum fratribus qui sunt in laodicia."
        },
        {
          verse_number: 2,
          verse_text: "Gratia et pax vobis a deo patre et domino ihesu christo."
        },
        {
          verse_number: 3,
          verse_text: "Gratias ago deo in omni oratione mea quod permanentes estis in eo et perseverantes in operibus bonis promissum expectantes in die iudicii."
        },
        {
          verse_number: 4,
          verse_text: "Ne destituant vos quorundam vaniloquentia insinuantium ut vos avertant a veritate evangelii quod a me praedicatum est."
        },
        {
          verse_number: 5,
          verse_text: "Et nunc deus faciet ut qui sunt ex me profectum veritatis evangelii deservientes faciant benignitatem operum salutis aeternae."
        },
        {
          verse_number: 6,
          verse_text: "Et nunc manifesta sunt vincula mea quae patior in christo in quibus gaudeo et laetor."
        },
        {
          verse_number: 7,
          verse_text: "Et hoc est mihi ad salutem perpetuam quod factum est orationibus vestris administrante spiritu sancto sive per vitam sive per mortem."
        },
        {
          verse_number: 8,
          verse_text: "Mihi enim vivere christus est et mori lucrum."
        },
        {
          verse_number: 9,
          verse_text: "Et ipse in vobis faciet misericordiam ut eandem caritatem habeatis et sitis unanimes."
        },
        {
          verse_number: 10,
          verse_text: "Ergo carissimi sicut audistis praesentiam meam ita retinete et facite in timore dei et erit vobis vita in aeternum."
        },
        {
          verse_number: 11,
          verse_text: "Deus est enim qui operatur in vobis."
        },
        {
          verse_number: 12,
          verse_text: "Et facite sine haesitatione quaecumque facitis."
        },
        {
          verse_number: 13,
          verse_text: "Et quod bonum est dilectissimi gaudete in christo et fugite sordidos in lucro."
        },
        {
          verse_number: 14,
          verse_text: "Omnes orationes vestrae manifestae sint apud deum et stabiles estote in sensu christi."
        },
        {
          verse_number: 15,
          verse_text: "Quaecumque sunt vera quaecumque sancta quaecumque iusta quaecumque amabilia haec sectamini."
        },
        {
          verse_number: 16,
          verse_text: "Quae et didicistis et accepistis haec in corde servate et pax erit vobiscum."
        },
        {
          verse_number: 17,
          verse_text: "Salutant vos fratres sancti."
        },
        {
          verse_number: 18,
          verse_text: "Gratia domini ihesu christi cum spiritu vestro."
        },
        {
          verse_number: 19,
          verse_text: "Et facite ut epistola laodicensium in ecclesia legatur."
        }
      ]
    },
    "03": {
      ms_id: "British Library, Royal MS",
      sigla: "03",
      other_names: "Codex Alexandrinus",
      total_folia: 773,
      laod_folia: "156r-157r",
      dimensions: "32×26 cm", 
      place_of_origin: "Alexandria, Egypt",
      materials: "Parchment",
      format_description: "Two Columns",
      date: "400-440",
      image_src: "/images/manuscript-image3.png",
      verses: [
        {
          verse_number: 1,
          verse_text: "Paulus apostolus non ab hominibus neque per hominem sed per ihesum christum fratribus qui sunt laodiciae."
        },
        {
          verse_number: 2,
          verse_text: "Gratia vobis et pax a deo patre nostro et domino ihesu christo."
        },
        {
          verse_number: 3,
          verse_text: "Gratias ago deo in omni memoria vestra quod permanentes estis in illo et perseverantes in operibus eius promissionem expectantes in die iudicii."
        },
        {
          verse_number: 4,
          verse_text: "Nec destituant vos quorundam vana loquentia insinuantium ut vos avertant a veritate evangelii quod a me praedicatur."
        },
        {
          verse_number: 5,
          verse_text: "Et nunc faciet dominus ut qui ex me sunt ad profectum evangelicae veritatis servientes faciant opera benignitatis ad salutem vitae aeternae."
        },
        {
          verse_number: 6,
          verse_text: "Et nunc manifesta sunt vincula quae patior in christo quibus gaudeo et laetor."
        },
        {
          verse_number: 7,
          verse_text: "Hoc enim mihi est ad salutem perpetuam quod ipsum factum orationibus vestris et subministrante spiritu sancto sive per vitam sive per mortem."
        },
        {
          verse_number: 8,
          verse_text: "Mihi enim vivere in christo est et mori gaudium."
        },
        {
          verse_number: 9,
          verse_text: "Et ipse faciet vobiscum misericordiam ut eandem dilectionem habeatis et sitis concordes."
        },
        {
          verse_number: 10,
          verse_text: "Itaque dilectissimi sicut audistis praesente me ita retinete et operamini in timore dei et erit vobis vita in aeternum."
        },
        {
          verse_number: 11,
          verse_text: "Deus enim est qui operatur in vobis."
        },
        {
          verse_number: 12,
          verse_text: "Omnia facite sine murmurationibus quaecumque facitis."
        },
        {
          verse_number: 13,
          verse_text: "Et quod optimum est dilectissimi gaudete in domino et abstinete ab omni turpi lucro."
        },
        {
          verse_number: 14,
          verse_text: "Omnia postulata vestra nota sint apud deum et constantes estote in sensu christi."
        },
        {
          verse_number: 15,
          verse_text: "Et quae vera et pudica et iusta et sancta et amabilia sunt haec agite."
        },
        {
          verse_number: 16,
          verse_text: "Et quae audistis et accepistis in corde tenete et erit vobis pax."
        },
        {
          verse_number: 17,
          verse_text: "Salutant vos omnes sancti."
        },
        {
          verse_number: 18,
          verse_text: "Gratia domini nostri ihesu christi cum spiritu vestro."
        },
        {
          verse_number: 19,
          verse_text: "Curate ut in ecclesia laodicensium legatur epistola."
        }
      ]
    },
    "04": {
      ms_id: "Saint Catherine's Monastery, Sinai",
      sigla: "04",
      other_names: "Codex Sinaiticus",
      total_folia: 400,
      laod_folia: "245r-246v",
      dimensions: "38×34 cm",
      place_of_origin: "Caesarea Maritima",
      materials: "Parchment",
      format_description: "Four Columns",
      date: "330-360",
      image_src: "/images/manuscript-image4.png",
      verses: [
        {
          verse_number: 1,
          verse_text: "Paulus apostolus non per hominem sed per ihesum christum fratribus qui sunt in laodicia."
        },
        {
          verse_number: 2,
          verse_text: "Gratia vobis et pax a deo patre et domino ihesu christo."
        },
        {
          verse_number: 3,
          verse_text: "Gratias ago christo in omni oratione mea quod statis in illo et perseveratis in operibus eius spem habentes in die iudicii."
        },
        {
          verse_number: 4,
          verse_text: "Neque turbent vos quorundam vana verba volentium vos avertere a veritate evangelii quod ego praedico."
        },
        {
          verse_number: 5,
          verse_text: "Et nunc deus faciet ut qui ex me sunt in profectum veritatis evangelii servientes faciant benignitatem operum in salutem aeternam."
        },
        {
          verse_number: 6,
          verse_text: "Nunc enim manifesta sunt vincula quae suffero in christo in quibus laetor."
        },
        {
          verse_number: 7,
          verse_text: "Hoc enim mihi in salutem perpetuam erit per vestras orationes et subministrationem spiritus sancti sive per vitam sive per mortem."
        },
        {
          verse_number: 8,
          verse_text: "Mihi enim vivere christus est et mori gaudium."
        },
        {
          verse_number: 9,
          verse_text: "Et ipse in vobis misericordiam suam operabitur ut eandem caritatem habeatis unanimes."
        },
        {
          verse_number: 10,
          verse_text: "Ergo dilectissimi ut audistis me praesentem ita servate et facite cum timore dei et habebitis vitam aeternam."
        },
        {
          verse_number: 11,
          verse_text: "Deus est enim qui operatur in vobis."
        },
        {
          verse_number: 12,
          verse_text: "Et omnia sine murmuratione facite quaecumque facitis."
        },
        {
          verse_number: 13,
          verse_text: "Denique fratres gaudete in domino et cavete ab omni turpi lucro."
        },
        {
          verse_number: 14,
          verse_text: "Omnes postulationes vestrae innotescant apud deum et firmi estote in sensu christi."
        },
        {
          verse_number: 15,
          verse_text: "Quaecumque sunt vera quaecumque pudica quaecumque iusta quaecumque sancta quaecumque amabilia haec facite."
        },
        {
          verse_number: 16,
          verse_text: "Et quae audistis et accepistis haec servate in cordibus et pax dei erit vobiscum."
        },
        {
          verse_number: 17,
          verse_text: "Salutant vos sancti universi."
        },
        {
          verse_number: 18,
          verse_text: "Gratia domini ihesu christi cum spiritu vestro."
        },
        {
          verse_number: 19,
          verse_text: "Facite ut in ecclesia laodicensium legatur epistola."
        }
      ]
    }
}; 