/* Khóa học Nimbus: 3 unit, 12 level, 5 dạng bài mỗi level.
   Nội dung nằm trong frontend để người học có bài ngay sau khi đăng ký;
   tiến độ lưu theo tài khoản trên thiết bị, không seed dữ liệu vào DB. */

export type CloudFriendId = 'nimbo' | 'pip' | 'lumi' | 'misty' | 'bibi' | 'coco'

export type ExerciseKind = 'choice' | 'match' | 'order' | 'listen' | 'fill'

type ExerciseBase = {
  friend: CloudFriendId
  prompt: string
  explain: string
}

export type ChoiceExercise = ExerciseBase & {
  kind: 'choice'
  question: string
  options: string[]
  answer: string
}

export type MatchExercise = ExerciseBase & {
  kind: 'match'
  pairs: { en: string; vi: string }[]
}

export type OrderExercise = ExerciseBase & {
  kind: 'order'
  answer: string
  tokens: string[]
  hint: string
}

export type ListenExercise = ExerciseBase & {
  kind: 'listen'
  audio: string
  answer: string
  hint: string
}

export type FillExercise = ExerciseBase & {
  kind: 'fill'
  sentence: string
  answer: string
  hint: string
}

export type Exercise =
  | ChoiceExercise
  | MatchExercise
  | OrderExercise
  | ListenExercise
  | FillExercise

export type LessonWord = {
  lemma: string
  ipa: string
  meaning: string
  example: string
}

export type CourseLevel = {
  id: string
  title: string
  subtitle: string
  buddy: CloudFriendId
  xp: number
  words: LessonWord[]
  exercises: Exercise[]
}

export type CourseUnit = {
  id: string
  title: string
  description: string
  cefr: string
  levels: CourseLevel[]
}

export const EXERCISE_LABEL: Record<ExerciseKind, string> = {
  choice: 'Trắc nghiệm',
  match: 'Ghép cặp',
  order: 'Xếp câu',
  listen: 'Nghe chép',
  fill: 'Điền từ',
}

export const COURSE_UNITS: CourseUnit[] = [
  {
    id: 'u1',
    title: 'Chào hỏi & làm quen',
    description: 'Những câu đầu tiên để bạn tự tin mở lời với bất kỳ ai.',
    cefr: 'A1',
    levels: [
      {
        id: '1-1',
        title: 'Hello, Nimbo!',
        subtitle: 'Lời chào và cảm ơn',
        buddy: 'nimbo',
        xp: 60,
        words: [
          { lemma: 'hello', ipa: '/həˈləʊ/', meaning: 'xin chào', example: 'Hello, nice to meet you.' },
          { lemma: 'goodbye', ipa: '/ɡʊdˈbaɪ/', meaning: 'tạm biệt', example: 'Goodbye, see you tomorrow.' },
          { lemma: 'thanks', ipa: '/θæŋks/', meaning: 'cảm ơn', example: 'Thanks for your help.' },
          { lemma: 'sorry', ipa: '/ˈsɒri/', meaning: 'xin lỗi', example: 'Sorry, I am late.' },
          { lemma: 'morning', ipa: '/ˈmɔːnɪŋ/', meaning: 'buổi sáng', example: 'Good morning, everyone!' },
        ],
        exercises: [
          {
            kind: 'choice',
            friend: 'pip',
            prompt: 'Chọn nghĩa đúng',
            question: '"Hello" nghĩa là gì?',
            options: ['Xin chào', 'Tạm biệt', 'Cảm ơn', 'Xin lỗi'],
            answer: 'Xin chào',
            explain: 'Hello dùng khi gặp ai đó, thân thiện và lịch sự.',
          },
          {
            kind: 'match',
            friend: 'misty',
            prompt: 'Ghép từ với nghĩa',
            pairs: [
              { en: 'hello', vi: 'xin chào' },
              { en: 'goodbye', vi: 'tạm biệt' },
              { en: 'thanks', vi: 'cảm ơn' },
              { en: 'sorry', vi: 'xin lỗi' },
            ],
            explain: 'Bốn từ này là bộ câu giao tiếp đầu tiên bạn nên nhớ.',
          },
          {
            kind: 'order',
            friend: 'lumi',
            prompt: 'Xếp thành câu đúng',
            tokens: ['Nice', 'to', 'meet', 'you'],
            answer: 'Nice to meet you',
            hint: 'Rất vui được gặp bạn.',
            explain: 'Nice to meet you là câu chuẩn khi gặp ai lần đầu.',
          },
          {
            kind: 'listen',
            friend: 'bibi',
            prompt: 'Nghe và chép lại',
            audio: 'Good morning',
            answer: 'Good morning',
            hint: 'Lời chào buổi sáng.',
            explain: 'Good morning dùng trước 12 giờ trưa.',
          },
          {
            kind: 'fill',
            friend: 'coco',
            prompt: 'Điền từ còn thiếu',
            sentence: '___ morning! How are you?',
            answer: 'Good',
            hint: 'Buổi sáng tốt lành!',
            explain: 'Cụm cố định là Good morning, không dùng Nice morning.',
          },
        ],
      },
      {
        id: '1-2',
        title: 'Tên và quốc tịch',
        subtitle: 'Giới thiệu bản thân',
        buddy: 'nimbo',
        xp: 60,
        words: [
          { lemma: 'name', ipa: '/neɪm/', meaning: 'tên', example: 'My name is Lan.' },
          { lemma: 'from', ipa: '/frɒm/', meaning: 'đến từ', example: 'I am from Vietnam.' },
          { lemma: 'country', ipa: '/ˈkʌntri/', meaning: 'quốc gia', example: 'Vietnam is my country.' },
          { lemma: 'Vietnam', ipa: '/ˌvjetˈnæm/', meaning: 'Việt Nam', example: 'I live in Vietnam.' },
          { lemma: 'Japan', ipa: '/dʒəˈpæn/', meaning: 'Nhật Bản', example: 'She comes from Japan.' },
        ],
        exercises: [
          {
            kind: 'choice',
            friend: 'pip',
            prompt: 'Chọn nghĩa đúng',
            question: '"What is your name?" nghĩa là gì?',
            options: ['Bạn tên là gì?', 'Bạn bao nhiêu tuổi?', 'Bạn đến từ đâu?', 'Bạn khỏe không?'],
            answer: 'Bạn tên là gì?',
            explain: 'What is your name? là câu hỏi tên lịch sự.',
          },
          {
            kind: 'fill',
            friend: 'coco',
            prompt: 'Điền từ còn thiếu',
            sentence: 'My name ___ Lan.',
            answer: 'is',
            hint: 'Tên của tôi là Lan.',
            explain: 'Chủ ngữ My name số ít nên dùng is.',
          },
          {
            kind: 'order',
            friend: 'lumi',
            prompt: 'Xếp thành câu đúng',
            tokens: ['I', 'am', 'from', 'Vietnam'],
            answer: 'I am from Vietnam',
            hint: 'Tôi đến từ Việt Nam.',
            explain: 'Cấu trúc: I am from + tên quốc gia.',
          },
          {
            kind: 'match',
            friend: 'misty',
            prompt: 'Ghép quốc gia với nghĩa',
            pairs: [
              { en: 'Vietnam', vi: 'Việt Nam' },
              { en: 'Japan', vi: 'Nhật Bản' },
              { en: 'Korea', vi: 'Hàn Quốc' },
              { en: 'America', vi: 'Nước Mỹ' },
            ],
            explain: 'Tên quốc gia luôn viết hoa chữ cái đầu.',
          },
          {
            kind: 'listen',
            friend: 'bibi',
            prompt: 'Nghe và chép lại',
            audio: 'I am from Vietnam',
            answer: 'I am from Vietnam',
            hint: 'Tôi đến từ Việt Nam.',
            explain: 'Nghe kỹ âm /frəm/ khi nói nhanh.',
          },
        ],
      },
      {
        id: '1-3',
        title: 'Bạn khỏe không?',
        subtitle: 'Hỏi thăm và cảm xúc',
        buddy: 'nimbo',
        xp: 70,
        words: [
          { lemma: 'fine', ipa: '/faɪn/', meaning: 'khỏe, ổn', example: 'I am fine, thank you.' },
          { lemma: 'tired', ipa: '/ˈtaɪəd/', meaning: 'mệt', example: 'I am tired after work.' },
          { lemma: 'happy', ipa: '/ˈhæpi/', meaning: 'vui', example: 'I am happy today.' },
          { lemma: 'hungry', ipa: '/ˈhʌŋɡri/', meaning: 'đói', example: 'I am hungry now.' },
          { lemma: 'today', ipa: '/təˈdeɪ/', meaning: 'hôm nay', example: 'Today is a good day.' },
        ],
        exercises: [
          {
            kind: 'choice',
            friend: 'pip',
            prompt: 'Chọn nghĩa đúng',
            question: '"How are you?" nghĩa là gì?',
            options: ['Bạn khỏe không?', 'Bạn tên là gì?', 'Bạn ở đâu?', 'Bạn thích gì?'],
            answer: 'Bạn khỏe không?',
            explain: 'How are you? là lời hỏi thăm quen thuộc.',
          },
          {
            kind: 'fill',
            friend: 'coco',
            prompt: 'Điền từ còn thiếu',
            sentence: 'I am fine, ___ you.',
            answer: 'thank',
            hint: 'Mình khỏe, cảm ơn bạn.',
            explain: 'Cụm đáp lại: I am fine, thank you.',
          },
          {
            kind: 'order',
            friend: 'lumi',
            prompt: 'Xếp thành câu đúng',
            tokens: ['I', 'am', 'very', 'well', 'today'],
            answer: 'I am very well today',
            hint: 'Hôm nay mình rất khỏe.',
            explain: 'Very well mạnh hơn fine một chút.',
          },
          {
            kind: 'match',
            friend: 'misty',
            prompt: 'Ghép từ với nghĩa',
            pairs: [
              { en: 'fine', vi: 'khỏe' },
              { en: 'tired', vi: 'mệt' },
              { en: 'happy', vi: 'vui' },
              { en: 'hungry', vi: 'đói' },
            ],
            explain: 'Đây là bốn tính từ cảm xúc dùng hằng ngày.',
          },
          {
            kind: 'listen',
            friend: 'bibi',
            prompt: 'Nghe và chép lại',
            audio: 'I am happy today',
            answer: 'I am happy today',
            hint: 'Hôm nay mình rất vui.',
            explain: 'Happy nhấn âm đầu /ˈhæp/.',
          },
        ],
      },
      {
        id: '1-4',
        title: 'Nói tạm biệt',
        subtitle: 'Ôn tập unit 1',
        buddy: 'nimbo',
        xp: 80,
        words: [
          { lemma: 'goodbye', ipa: '/ɡʊdˈbaɪ/', meaning: 'tạm biệt', example: 'Goodbye and good luck!' },
          { lemma: 'tomorrow', ipa: '/təˈmɒrəʊ/', meaning: 'ngày mai', example: 'See you tomorrow.' },
          { lemma: 'later', ipa: '/ˈleɪtə/', meaning: 'lát nữa', example: 'See you later.' },
          { lemma: 'night', ipa: '/naɪt/', meaning: 'đêm', example: 'Good night, Nimbo.' },
          { lemma: 'see', ipa: '/siː/', meaning: 'gặp, thấy', example: 'See you soon.' },
        ],
        exercises: [
          {
            kind: 'choice',
            friend: 'pip',
            prompt: 'Chọn nghĩa đúng',
            question: '"See you later" nghĩa là gì?',
            options: ['Hẹn gặp lại', 'Chúc ngủ ngon', 'Cảm ơn nhé', 'Xin lỗi nhé'],
            answer: 'Hẹn gặp lại',
            explain: 'See you later dùng khi sẽ gặp lại trong ngày.',
          },
          {
            kind: 'fill',
            friend: 'coco',
            prompt: 'Điền từ còn thiếu',
            sentence: 'Have a ___ day!',
            answer: 'nice',
            hint: 'Chúc một ngày tốt lành!',
            explain: 'Have a nice day là lời chúc lịch sự.',
          },
          {
            kind: 'order',
            friend: 'lumi',
            prompt: 'Xếp thành câu đúng',
            tokens: ['Goodbye', 'and', 'see', 'you', 'tomorrow'],
            answer: 'Goodbye and see you tomorrow',
            hint: 'Tạm biệt và hẹn gặp bạn ngày mai.',
            explain: 'Có thể nối hai lời chào bằng and.',
          },
          {
            kind: 'match',
            friend: 'misty',
            prompt: 'Ghép từ với nghĩa',
            pairs: [
              { en: 'goodbye', vi: 'tạm biệt' },
              { en: 'tomorrow', vi: 'ngày mai' },
              { en: 'later', vi: 'lát nữa' },
              { en: 'night', vi: 'đêm' },
            ],
            explain: 'Chú ý night là ban đêm, evening là buổi tối.',
          },
          {
            kind: 'listen',
            friend: 'bibi',
            prompt: 'Nghe và chép lại',
            audio: 'Good night, Nimbo',
            answer: 'Good night, Nimbo',
            hint: 'Chúc ngủ ngon, Nimbo.',
            explain: 'Good night dùng trước khi đi ngủ.',
          },
        ],
      },
    ],
  },
  {
    id: 'u2',
    title: 'Đời sống hằng ngày',
    description: 'Từ bữa sáng đến cuối tuần — nói về ngày của bạn.',
    cefr: 'A2',
    levels: [
      {
        id: '2-1',
        title: 'Buổi sáng của tôi',
        subtitle: 'Thói quen mỗi ngày',
        buddy: 'nimbo',
        xp: 90,
        words: [
          { lemma: 'wake', ipa: '/weɪk/', meaning: 'thức dậy', example: 'I wake up at six.' },
          { lemma: 'breakfast', ipa: '/ˈbrekfəst/', meaning: 'bữa sáng', example: 'She has breakfast at seven.' },
          { lemma: 'brush', ipa: '/brʌʃ/', meaning: 'đánh, chải', example: 'I brush my teeth every morning.' },
          { lemma: 'bike', ipa: '/baɪk/', meaning: 'xe đạp', example: 'I go to school by bike.' },
          { lemma: 'morning', ipa: '/ˈmɔːnɪŋ/', meaning: 'buổi sáng', example: 'The morning is cool today.' },
        ],
        exercises: [
          {
            kind: 'choice',
            friend: 'pip',
            prompt: 'Chọn đáp án đúng',
            question: 'I ___ up at six every day.',
            options: ['wake', 'wakes', 'waking', 'woke'],
            answer: 'wake',
            explain: 'Chủ ngữ I dùng động từ nguyên mẫu wake.',
          },
          {
            kind: 'order',
            friend: 'lumi',
            prompt: 'Xếp thành câu đúng',
            tokens: ['I', 'brush', 'my', 'teeth', 'every', 'morning'],
            answer: 'I brush my teeth every morning',
            hint: 'Mình đánh răng mỗi sáng.',
            explain: 'Trạng từ tần suất every morning đứng cuối câu.',
          },
          {
            kind: 'fill',
            friend: 'coco',
            prompt: 'Điền từ còn thiếu',
            sentence: 'She ___ breakfast at seven.',
            answer: 'has',
            hint: 'Cô ấy ăn sáng lúc bảy giờ.',
            explain: 'Chủ ngữ she dùng has, không dùng have.',
          },
          {
            kind: 'listen',
            friend: 'bibi',
            prompt: 'Nghe và chép lại',
            audio: 'I go to school by bike',
            answer: 'I go to school by bike',
            hint: 'Mình đi học bằng xe đạp.',
            explain: 'By + phương tiện: by bike, by bus.',
          },
          {
            kind: 'match',
            friend: 'misty',
            prompt: 'Ghép từ với nghĩa',
            pairs: [
              { en: 'wake up', vi: 'thức dậy' },
              { en: 'breakfast', vi: 'bữa sáng' },
              { en: 'brush', vi: 'đánh răng' },
              { en: 'bike', vi: 'xe đạp' },
            ],
            explain: 'Cụm wake up là động từ ghép thường gặp.',
          },
        ],
      },
      {
        id: '2-2',
        title: 'Ở quán cà phê',
        subtitle: 'Gọi đồ uống',
        buddy: 'nimbo',
        xp: 90,
        words: [
          { lemma: 'coffee', ipa: '/ˈkɒfi/', meaning: 'cà phê', example: 'A cup of coffee, please.' },
          { lemma: 'tea', ipa: '/tiː/', meaning: 'trà', example: 'I like green tea.' },
          { lemma: 'water', ipa: '/ˈwɔːtə/', meaning: 'nước', example: 'Can I have some water?' },
          { lemma: 'sugar', ipa: '/ˈʃʊɡə/', meaning: 'đường', example: 'No sugar for me, thanks.' },
          { lemma: 'cup', ipa: '/kʌp/', meaning: 'tách, cốc', example: 'Two cups of tea, please.' },
        ],
        exercises: [
          {
            kind: 'choice',
            friend: 'pip',
            prompt: 'Chọn nghĩa đúng',
            question: '"I would like a cup of coffee." nghĩa là gì?',
            options: ['Tôi muốn một tách cà phê.', 'Tôi đã uống cà phê.', 'Cà phê ở đây rất ngon.', 'Tôi không thích cà phê.'],
            answer: 'Tôi muốn một tách cà phê.',
            explain: 'I would like là cách gọi đồ uống lịch sự.',
          },
          {
            kind: 'fill',
            friend: 'coco',
            prompt: 'Điền từ còn thiếu',
            sentence: 'How ___ is it?',
            answer: 'much',
            hint: 'Cái này giá bao nhiêu?',
            explain: 'How much dùng để hỏi giá.',
          },
          {
            kind: 'order',
            friend: 'lumi',
            prompt: 'Xếp thành câu đúng',
            tokens: ['Can', 'I', 'have', 'some', 'water', 'please'],
            answer: 'Can I have some water please',
            hint: 'Cho mình xin ít nước được không?',
            explain: 'Please đứng cuối câu để giữ lịch sự.',
          },
          {
            kind: 'listen',
            friend: 'bibi',
            prompt: 'Nghe và chép lại',
            audio: 'A cup of tea, please',
            answer: 'A cup of tea, please',
            hint: 'Cho mình một tách trà.',
            explain: 'A cup of + đồ uống là mẫu câu gọi món.',
          },
          {
            kind: 'match',
            friend: 'misty',
            prompt: 'Ghép từ với nghĩa',
            pairs: [
              { en: 'coffee', vi: 'cà phê' },
              { en: 'tea', vi: 'trà' },
              { en: 'water', vi: 'nước' },
              { en: 'sugar', vi: 'đường' },
            ],
            explain: 'Sugar không đếm được nên không nói a sugar.',
          },
        ],
      },
      {
        id: '2-3',
        title: 'Đi siêu thị',
        subtitle: 'Mua sắm và hỏi giá',
        buddy: 'nimbo',
        xp: 100,
        words: [
          { lemma: 'cost', ipa: '/kɒst/', meaning: 'giá, tốn', example: 'How much does it cost?' },
          { lemma: 'bottle', ipa: '/ˈbɒtl/', meaning: 'chai', example: 'I need two bottles of milk.' },
          { lemma: 'fruit', ipa: '/fruːt/', meaning: 'trái cây', example: 'The fruit section is over there.' },
          { lemma: 'fresh', ipa: '/freʃ/', meaning: 'tươi', example: 'These apples are fresh.' },
          { lemma: 'cheap', ipa: '/tʃiːp/', meaning: 'rẻ', example: 'This shirt is cheap.' },
        ],
        exercises: [
          {
            kind: 'choice',
            friend: 'pip',
            prompt: 'Chọn nghĩa đúng',
            question: '"How much does it cost?" nghĩa là gì?',
            options: ['Cái này giá bao nhiêu?', 'Cái này nặng không?', 'Cái này ở đâu?', 'Cái này có tươi không?'],
            answer: 'Cái này giá bao nhiêu?',
            explain: 'Cost là động từ chỉ giá tiền.',
          },
          {
            kind: 'fill',
            friend: 'coco',
            prompt: 'Điền từ còn thiếu',
            sentence: 'I need two ___ of milk.',
            answer: 'bottles',
            hint: 'Mình cần hai chai sữa.',
            explain: 'Hai chai nên dùng số nhiều bottles.',
          },
          {
            kind: 'order',
            friend: 'lumi',
            prompt: 'Xếp thành câu đúng',
            tokens: ['Where', 'is', 'the', 'fruit', 'section'],
            answer: 'Where is the fruit section',
            hint: 'Khu trái cây ở đâu?',
            explain: 'Where is + danh từ để hỏi vị trí.',
          },
          {
            kind: 'listen',
            friend: 'bibi',
            prompt: 'Nghe và chép lại',
            audio: 'The apples are fresh today',
            answer: 'The apples are fresh today',
            hint: 'Hôm nay táo rất tươi.',
            explain: 'Apples số nhiều đi với are.',
          },
          {
            kind: 'match',
            friend: 'misty',
            prompt: 'Ghép từ với nghĩa',
            pairs: [
              { en: 'cheap', vi: 'rẻ' },
              { en: 'expensive', vi: 'đắt' },
              { en: 'fresh', vi: 'tươi' },
              { en: 'fruit', vi: 'trái cây' },
            ],
            explain: 'Cheap và expensive là cặp tính từ trái nghĩa.',
          },
        ],
      },
      {
        id: '2-4',
        title: 'Cuối tuần',
        subtitle: 'Kế hoạch và thư giãn',
        buddy: 'nimbo',
        xp: 100,
        words: [
          { lemma: 'weekend', ipa: '/ˌwiːkˈend/', meaning: 'cuối tuần', example: 'What do you do on weekends?' },
          { lemma: 'movie', ipa: '/ˈmuːvi/', meaning: 'phim', example: "Let's watch a movie tonight." },
          { lemma: 'visit', ipa: '/ˈvɪzɪt/', meaning: 'thăm', example: 'I visit my grandparents.' },
          { lemma: 'play', ipa: '/pleɪ/', meaning: 'chơi', example: 'We play football on Sunday.' },
          { lemma: 'tonight', ipa: '/təˈnaɪt/', meaning: 'tối nay', example: 'See you tonight.' },
        ],
        exercises: [
          {
            kind: 'choice',
            friend: 'pip',
            prompt: 'Chọn nghĩa đúng',
            question: '"What do you do on weekends?" nghĩa là gì?',
            options: ['Bạn làm gì vào cuối tuần?', 'Bạn đi đâu cuối tuần?', 'Cuối tuần bạn có rảnh không?', 'Bạn thích cuối tuần không?'],
            answer: 'Bạn làm gì vào cuối tuần?',
            explain: 'On weekends chỉ thời gian lặp lại.',
          },
          {
            kind: 'fill',
            friend: 'coco',
            prompt: 'Điền từ còn thiếu',
            sentence: 'We often ___ football on Sunday.',
            answer: 'play',
            hint: 'Chúng mình thường chơi bóng vào Chủ nhật.',
            explain: 'Play + môn thể thao: play football.',
          },
          {
            kind: 'order',
            friend: 'lumi',
            prompt: 'Xếp thành câu đúng',
            tokens: ['I', 'visit', 'my', 'grandparents', 'every', 'weekend'],
            answer: 'I visit my grandparents every weekend',
            hint: 'Mình thăm ông bà mỗi cuối tuần.',
            explain: 'Every weekend đứng cuối câu.',
          },
          {
            kind: 'listen',
            friend: 'bibi',
            prompt: 'Nghe và chép lại',
            audio: "Let's watch a movie tonight",
            answer: "Let's watch a movie tonight",
            hint: 'Tối nay xem phim nhé.',
            explain: "Let's + động từ để rủ ai đó.",
          },
          {
            kind: 'match',
            friend: 'misty',
            prompt: 'Ghép từ với nghĩa',
            pairs: [
              { en: 'weekend', vi: 'cuối tuần' },
              { en: 'movie', vi: 'phim' },
              { en: 'visit', vi: 'thăm' },
              { en: 'grandparents', vi: 'ông bà' },
            ],
            explain: 'Grandparents là ông bà, không phân biệt bên nội ngoại.',
          },
        ],
      },
    ],
  },
  {
    id: 'u3',
    title: 'Học tập & công việc',
    description: 'Tự tin trong lớp học, email và buổi thuyết trình.',
    cefr: 'B1',
    levels: [
      {
        id: '3-1',
        title: 'Trong lớp học',
        subtitle: 'Hỏi và ghi chú',
        buddy: 'nimbo',
        xp: 110,
        words: [
          { lemma: 'homework', ipa: '/ˈhəʊmwɜːk/', meaning: 'bài tập về nhà', example: 'I finish my homework before class.' },
          { lemma: 'lesson', ipa: '/ˈlesn/', meaning: 'bài học', example: 'The lesson starts at nine.' },
          { lemma: 'teacher', ipa: '/ˈtiːtʃə/', meaning: 'giáo viên', example: 'The teacher explained the lesson.' },
          { lemma: 'explain', ipa: '/ɪkˈspleɪn/', meaning: 'giải thích', example: 'Could you explain this word?' },
          { lemma: 'finish', ipa: '/ˈfɪnɪʃ/', meaning: 'hoàn thành', example: 'I finish my work at five.' },
        ],
        exercises: [
          {
            kind: 'choice',
            friend: 'pip',
            prompt: 'Chọn nghĩa đúng',
            question: '"Could you repeat that, please?" nghĩa là gì?',
            options: ['Bạn có thể nhắc lại được không?', 'Bạn có hiểu không?', 'Bạn có thể viết lại không?', 'Bạn có thể nói to hơn không?'],
            answer: 'Bạn có thể nhắc lại được không?',
            explain: 'Repeat là nhắc lại, could you giúp câu lịch sự hơn.',
          },
          {
            kind: 'fill',
            friend: 'coco',
            prompt: 'Điền từ còn thiếu',
            sentence: 'I need to ___ my homework before class.',
            answer: 'finish',
            hint: 'Mình cần làm xong bài tập trước giờ học.',
            explain: 'Finish + danh từ: finish homework.',
          },
          {
            kind: 'order',
            friend: 'lumi',
            prompt: 'Xếp thành câu đúng',
            tokens: ['The', 'teacher', 'explained', 'the', 'lesson', 'clearly'],
            answer: 'The teacher explained the lesson clearly',
            hint: 'Giáo viên giải thích bài học rất rõ.',
            explain: 'Trạng từ clearly đứng sau động từ và tân ngữ.',
          },
          {
            kind: 'listen',
            friend: 'bibi',
            prompt: 'Nghe và chép lại',
            audio: 'Please open your book to page ten',
            answer: 'Please open your book to page ten',
            hint: 'Mở sách trang mười.',
            explain: 'Page ten đọc là page ten, không thêm số thứ tự.',
          },
          {
            kind: 'match',
            friend: 'misty',
            prompt: 'Ghép từ với nghĩa',
            pairs: [
              { en: 'homework', vi: 'bài tập về nhà' },
              { en: 'lesson', vi: 'bài học' },
              { en: 'teacher', vi: 'giáo viên' },
              { en: 'explain', vi: 'giải thích' },
            ],
            explain: 'Teacher là người dạy, lesson là nội dung bài.',
          },
        ],
      },
      {
        id: '3-2',
        title: 'Email công việc',
        subtitle: 'Trao đổi chuyên nghiệp',
        buddy: 'nimbo',
        xp: 110,
        words: [
          { lemma: 'meeting', ipa: '/ˈmiːtɪŋ/', meaning: 'cuộc họp', example: 'I am writing to follow up on our meeting.' },
          { lemma: 'report', ipa: '/rɪˈpɔːt/', meaning: 'báo cáo', example: 'Please find the report attached.' },
          { lemma: 'attach', ipa: '/əˈtætʃ/', meaning: 'đính kèm', example: 'I attach the file here.' },
          { lemma: 'reply', ipa: '/rɪˈplaɪ/', meaning: 'trả lời', example: 'Thank you for your quick reply.' },
          { lemma: 'file', ipa: '/faɪl/', meaning: 'tệp, hồ sơ', example: 'Could you send me the file?' },
        ],
        exercises: [
          {
            kind: 'choice',
            friend: 'pip',
            prompt: 'Chọn nghĩa đúng',
            question: '"I am writing to follow up on our meeting." nghĩa là gì?',
            options: ['Tôi viết để theo dõi cuộc họp của chúng ta.', 'Tôi viết để hủy cuộc họp.', 'Tôi viết để cảm ơn cuộc họp.', 'Tôi viết để dời cuộc họp.'],
            answer: 'Tôi viết để theo dõi cuộc họp của chúng ta.',
            explain: 'Follow up on = theo dõi, nhắc lại vấn đề đã trao đổi.',
          },
          {
            kind: 'fill',
            friend: 'coco',
            prompt: 'Điền từ còn thiếu',
            sentence: 'Please find the report ___.',
            answer: 'attached',
            hint: 'Vui lòng xem báo cáo đính kèm.',
            explain: 'Cụm chuẩn trong email: please find ... attached.',
          },
          {
            kind: 'order',
            friend: 'lumi',
            prompt: 'Xếp thành câu đúng',
            tokens: ['Could', 'you', 'send', 'me', 'the', 'file', 'by', 'Friday'],
            answer: 'Could you send me the file by Friday',
            hint: 'Bạn có thể gửi tệp cho mình trước thứ Sáu không?',
            explain: 'By Friday = trước hoặc muộn nhất là thứ Sáu.',
          },
          {
            kind: 'listen',
            friend: 'bibi',
            prompt: 'Nghe và chép lại',
            audio: 'Thank you for your quick reply',
            answer: 'Thank you for your quick reply',
            hint: 'Cảm ơn bạn đã trả lời nhanh.',
            explain: 'Thank you for + danh từ/cụm danh từ.',
          },
          {
            kind: 'match',
            friend: 'misty',
            prompt: 'Ghép từ với nghĩa',
            pairs: [
              { en: 'meeting', vi: 'cuộc họp' },
              { en: 'report', vi: 'báo cáo' },
              { en: 'attach', vi: 'đính kèm' },
              { en: 'reply', vi: 'trả lời' },
            ],
            explain: 'Attach dùng khi gửi kèm tệp trong email.',
          },
        ],
      },
      {
        id: '3-3',
        title: 'Thuyết trình',
        subtitle: 'Dẫn dắt và nhấn mạnh',
        buddy: 'nimbo',
        xp: 120,
        words: [
          { lemma: 'slide', ipa: '/slaɪd/', meaning: 'trang trình chiếu', example: "Let's move on to the next slide." },
          { lemma: 'chart', ipa: '/tʃɑːt/', meaning: 'biểu đồ', example: 'The chart shows sales increased.' },
          { lemma: 'increase', ipa: '/ɪnˈkriːs/', meaning: 'tăng', example: 'Sales increased last month.' },
          { lemma: 'highlight', ipa: '/ˈhaɪlaɪt/', meaning: 'nhấn mạnh', example: 'I would like to highlight three points.' },
          { lemma: 'point', ipa: '/pɔɪnt/', meaning: 'điểm, ý', example: 'That is a good point.' },
        ],
        exercises: [
          {
            kind: 'choice',
            friend: 'pip',
            prompt: 'Chọn nghĩa đúng',
            question: '"Let\'s move on to the next slide." nghĩa là gì?',
            options: ['Chúng ta chuyển sang slide tiếp theo.', 'Chúng ta quay lại slide trước.', 'Chúng ta dừng thuyết trình.', 'Chúng ta xem lại biểu đồ.'],
            answer: 'Chúng ta chuyển sang slide tiếp theo.',
            explain: 'Move on to = chuyển sang phần tiếp theo.',
          },
          {
            kind: 'fill',
            friend: 'coco',
            prompt: 'Điền từ còn thiếu',
            sentence: 'The chart ___ that sales increased.',
            answer: 'shows',
            hint: 'Biểu đồ cho thấy doanh số đã tăng.',
            explain: 'Chủ ngữ the chart số ít nên dùng shows.',
          },
          {
            kind: 'order',
            friend: 'lumi',
            prompt: 'Xếp thành câu đúng',
            tokens: ['I', 'would', 'like', 'to', 'highlight', 'three', 'main', 'points'],
            answer: 'I would like to highlight three main points',
            hint: 'Mình muốn nhấn mạnh ba điểm chính.',
            explain: 'Would like to + động từ là cách nói trang trọng.',
          },
          {
            kind: 'listen',
            friend: 'bibi',
            prompt: 'Nghe và chép lại',
            audio: 'Any questions so far',
            answer: 'Any questions so far',
            hint: 'Có câu hỏi nào đến giờ không?',
            explain: 'So far = tính đến thời điểm này.',
          },
          {
            kind: 'match',
            friend: 'misty',
            prompt: 'Ghép từ với nghĩa',
            pairs: [
              { en: 'slide', vi: 'trang trình chiếu' },
              { en: 'chart', vi: 'biểu đồ' },
              { en: 'increase', vi: 'tăng' },
              { en: 'highlight', vi: 'nhấn mạnh' },
            ],
            explain: 'Increase có trọng âm ở âm tiết thứ hai.',
          },
        ],
      },
      {
        id: '3-4',
        title: 'Tổng kết khóa học',
        subtitle: 'Ôn tập và bứt phá',
        buddy: 'nimbo',
        xp: 140,
        words: [
          { lemma: 'progress', ipa: '/ˈprəʊɡres/', meaning: 'tiến bộ', example: 'Small steps lead to big progress.' },
          { lemma: 'improve', ipa: '/ɪmˈpruːv/', meaning: 'cải thiện', example: 'Keep practicing to improve.' },
          { lemma: 'practice', ipa: '/ˈpræktɪs/', meaning: 'luyện tập', example: 'Practice makes perfect.' },
          { lemma: 'finish', ipa: '/ˈfɪnɪʃ/', meaning: 'hoàn thành', example: 'You have finished the course!' },
          { lemma: 'step', ipa: '/step/', meaning: 'bước', example: 'Take one step at a time.' },
        ],
        exercises: [
          {
            kind: 'choice',
            friend: 'pip',
            prompt: 'Chọn nghĩa đúng',
            question: '"Practice makes perfect." nghĩa là gì?',
            options: ['Có công mài sắt, có ngày nên kim.', 'Thời gian là vàng.', 'Học tài thi phận.', 'Đi một ngày đàng, học một sàng khôn.'],
            answer: 'Có công mài sắt, có ngày nên kim.',
            explain: 'Câu tục ngữ nhấn mạnh luyện tập đều đặn.',
          },
          {
            kind: 'fill',
            friend: 'coco',
            prompt: 'Điền từ còn thiếu',
            sentence: 'Keep ___ every day to improve.',
            answer: 'practicing',
            hint: 'Luyện tập mỗi ngày để tiến bộ.',
            explain: 'Keep + V-ing: keep practicing.',
          },
          {
            kind: 'order',
            friend: 'lumi',
            prompt: 'Xếp thành câu đúng',
            tokens: ['Small', 'steps', 'lead', 'to', 'big', 'progress'],
            answer: 'Small steps lead to big progress',
            hint: 'Những bước nhỏ dẫn tới tiến bộ lớn.',
            explain: 'Lead to = dẫn đến.',
          },
          {
            kind: 'listen',
            friend: 'bibi',
            prompt: 'Nghe và chép lại',
            audio: 'You have finished the Nimbus course',
            answer: 'You have finished the Nimbus course',
            hint: 'Bạn đã hoàn thành khóa Nimbus.',
            explain: 'Hiện tại hoàn thành: have + V3 finished.',
          },
          {
            kind: 'match',
            friend: 'misty',
            prompt: 'Ghép từ với nghĩa',
            pairs: [
              { en: 'progress', vi: 'tiến bộ' },
              { en: 'improve', vi: 'cải thiện' },
              { en: 'practice', vi: 'luyện tập' },
              { en: 'finish', vi: 'hoàn thành' },
            ],
            explain: 'Chúc mừng bạn đã đi hết 12 level của khóa Nimbus!',
          },
        ],
      },
    ],
  },
]

export const ALL_LEVELS: CourseLevel[] = COURSE_UNITS.flatMap((unit) => unit.levels)

export function levelIndex(levelId: string): number {
  return ALL_LEVELS.findIndex((level) => level.id === levelId)
}

export function findLevel(levelId: string | undefined): CourseLevel | null {
  if (!levelId) return null
  return ALL_LEVELS.find((level) => level.id === levelId) ?? null
}

export function unitOfLevel(level: CourseLevel): CourseUnit | null {
  return COURSE_UNITS.find((unit) => unit.levels.some((item) => item.id === level.id)) ?? null
}

export function exerciseKinds(level: CourseLevel): ExerciseKind[] {
  return [...new Set(level.exercises.map((exercise) => exercise.kind))]
}
