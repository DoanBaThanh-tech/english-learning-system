namespace EnglishApp.Api.Data.Seed;

public sealed record SeedExample(string En, string Vi);

public sealed record SeedSense(
    string Pos,
    string LevelCode,
    string DefinitionEn,
    string MeaningVi,
    params SeedExample[] Examples);

public sealed record SeedWord(
    string Lemma,
    string IpaUs,
    string IpaUk,
    params SeedSense[] Senses);

/// <summary>
/// Bộ từ "hạt giống" có nghĩa tiếng Việt đã kiểm duyệt, tập trung vào từ đa nghĩa
/// để minh họa chọn nghĩa theo ngữ cảnh. Từ ngoài danh sách sẽ được tra qua
/// Free Dictionary API rồi dịch và lưu cache vào DB.
/// </summary>
public static class CuratedWordSeed
{
    public static IReadOnlyList<SeedWord> Words { get; } = new List<SeedWord>
    {
        new SeedWord("run", "/rʌn/", "/rʌn/",
            new SeedSense("verb", "A1", "to move quickly on foot", "chạy",
                new SeedExample("I run every morning before work.", "Tôi chạy bộ mỗi sáng trước giờ làm."),
                new SeedExample("She ran to catch the bus.", "Cô ấy chạy để bắt kịp xe buýt.")),
            new SeedSense("verb", "B1", "to manage or operate a business or organization", "điều hành",
                new SeedExample("She runs a small café in District 1.", "Cô ấy điều hành một quán cà phê nhỏ ở Quận 1."),
                new SeedExample("He has been running the company for ten years.", "Anh ấy đã điều hành công ty được mười năm.")),
            new SeedSense("verb", "B1", "to function or operate, especially a machine or program", "vận hành, chạy (máy)",
                new SeedExample("The application runs on Windows and macOS.", "Ứng dụng chạy trên Windows và macOS."),
                new SeedExample("The engine is running smoothly.", "Động cơ đang chạy êm.")),
            new SeedSense("noun", "A2", "an act or period of running", "cuộc chạy bộ",
                new SeedExample("Let's go for a run after class.", "Chúng ta đi chạy bộ sau giờ học nhé."))),

        new SeedWord("light", "/laɪt/", "/laɪt/",
            new SeedSense("noun", "A1", "the brightness that makes things visible", "ánh sáng",
                new SeedExample("Turn on the light, please.", "Làm ơn bật đèn lên."),
                new SeedExample("The room was filled with warm light.", "Căn phòng tràn ngập ánh sáng ấm áp.")),
            new SeedSense("adjective", "A2", "not heavy; easy to carry", "nhẹ",
                new SeedExample("This backpack is very light.", "Chiếc ba lô này rất nhẹ.")),
            new SeedSense("adjective", "B1", "pale in color", "nhạt (màu)",
                new SeedExample("She wore a light blue dress.", "Cô ấy mặc một chiếc váy màu xanh nhạt."))),

        new SeedWord("book", "/bʊk/", "/bʊk/",
            new SeedSense("noun", "A1", "a set of printed pages bound together", "quyển sách",
                new SeedExample("I am reading a book about artificial intelligence.", "Tôi đang đọc một quyển sách về trí tuệ nhân tạo.")),
            new SeedSense("verb", "B1", "to reserve something in advance", "đặt trước",
                new SeedExample("I booked a table for two at the restaurant.", "Tôi đã đặt một bàn hai người ở nhà hàng."))),

        new SeedWord("bank", "/bæŋk/", "/bæŋk/",
            new SeedSense("noun", "A1", "a financial institution that keeps money", "ngân hàng",
                new SeedExample("I need to go to the bank to deposit some money.", "Tôi cần đến ngân hàng để gửi tiền.")),
            new SeedSense("noun", "A2", "the land along the side of a river", "bờ sông",
                new SeedExample("We sat on the river bank and watched the sunset.", "Chúng tôi ngồi trên bờ sông và ngắm hoàng hôn."))),

        new SeedWord("spring", "/sprɪŋ/", "/sprɪŋ/",
            new SeedSense("noun", "A1", "the season between winter and summer", "mùa xuân",
                new SeedExample("Flowers bloom in spring.", "Hoa nở vào mùa xuân.")),
            new SeedSense("noun", "B1", "a coiled piece of metal that returns to its shape", "lò xo",
                new SeedExample("The spring in the mattress is broken.", "Lò xo trong nệm bị hỏng.")),
            new SeedSense("verb", "B1", "to jump or move suddenly", "bật nhảy",
                new SeedExample("The cat sprang onto the table.", "Con mèo bật nhảy lên bàn."))),

        new SeedWord("set", "/set/", "/set/",
            new SeedSense("verb", "A2", "to put something in a particular place", "đặt, để",
                new SeedExample("Please set the book on the table.", "Làm ơn đặt quyển sách lên bàn.")),
            new SeedSense("verb", "B1", "to establish or adjust something", "thiết lập",
                new SeedExample("She set a new record for the race.", "Cô ấy đã thiết lập kỷ lục mới cho cuộc đua.")),
            new SeedSense("noun", "B1", "a group of similar things used together", "bộ",
                new SeedExample("He bought a set of tools for his workshop.", "Anh ấy mua một bộ dụng cụ cho xưởng của mình."))),

        new SeedWord("get", "/ɡet/", "/ɡet/",
            new SeedSense("verb", "A1", "to obtain or receive something", "nhận, lấy",
                new SeedExample("I need to get some milk from the store.", "Tôi cần lấy ít sữa từ cửa hàng.")),
            new SeedSense("verb", "A1", "to become a particular state", "trở nên",
                new SeedExample("It gets cold in winter.", "Trời trở nên lạnh vào mùa đông.")),
            new SeedSense("verb", "A2", "to arrive at a place", "đến",
                new SeedExample("What time do you get to work?", "Mấy giờ bạn đến chỗ làm?"))),

        new SeedWord("take", "/teɪk/", "/teɪk/",
            new SeedSense("verb", "A1", "to carry or bring something with you", "mang theo",
                new SeedExample("Take an umbrella with you; it might rain.", "Mang theo ô nhé; trời có thể mưa.")),
            new SeedSense("verb", "A1", "to need a particular amount of time", "mất (thời gian)",
                new SeedExample("It takes twenty minutes to get there.", "Mất hai mươi phút để đến đó.")),
            new SeedSense("verb", "B1", "to accept an offer or job", "chấp nhận",
                new SeedExample("She took the job offer in Ho Chi Minh City.", "Cô ấy đã chấp nhận lời mời làm việc ở Thành phố Hồ Chí Minh."))),

        new SeedWord("right", "/raɪt/", "/raɪt/",
            new SeedSense("adjective", "A1", "correct or true", "đúng",
                new SeedExample("You are right about the deadline.", "Bạn đúng về hạn chót.")),
            new SeedSense("noun", "A2", "the direction opposite to left", "bên phải",
                new SeedExample("Turn right at the next corner.", "Rẽ phải ở góc đường tiếp theo.")),
            new SeedSense("noun", "B1", "something a person is morally or legally allowed to have", "quyền",
                new SeedExample("Everyone has the right to education.", "Mọi người đều có quyền được giáo dục."))),

        new SeedWord("kind", "/kaɪnd/", "/kaɪnd/",
            new SeedSense("adjective", "A1", "caring and generous to other people", "tử tế",
                new SeedExample("She is very kind to animals.", "Cô ấy rất tử tế với động vật.")),
            new SeedSense("noun", "A2", "a type or category", "loại",
                new SeedExample("What kind of music do you like?", "Bạn thích loại nhạc nào?"))),

        new SeedWord("fine", "/faɪn/", "/faɪn/",
            new SeedSense("adjective", "A1", "well or satisfactory", "ổn, khỏe",
                new SeedExample("I'm fine, thank you.", "Tôi ổn, cảm ơn bạn.")),
            new SeedSense("noun", "B1", "money paid as a punishment", "tiền phạt",
                new SeedExample("He had to pay a fine for parking illegally.", "Anh ấy phải trả tiền phạt vì đỗ xe sai quy định."))),

        new SeedWord("match", "/mætʃ/", "/mætʃ/",
            new SeedSense("noun", "A1", "a sports competition between two teams or players", "trận đấu",
                new SeedExample("We watched a football match last night.", "Chúng tôi đã xem một trận bóng đá tối qua.")),
            new SeedSense("verb", "B1", "to look good together with something", "hợp, phù hợp",
                new SeedExample("This shirt matches your shoes perfectly.", "Chiếc áo này hợp với đôi giày của bạn một cách hoàn hảo."))),

        new SeedWord("order", "/ˈɔːrdər/", "/ˈɔːdə/",
            new SeedSense("noun", "A2", "a request for food or goods", "món đã gọi",
                new SeedExample("The waiter brought our order.", "Người phục vụ mang món chúng tôi đã gọi.")),
            new SeedSense("verb", "A2", "to ask for food or goods", "gọi món, đặt hàng",
                new SeedExample("I ordered a coffee and a sandwich.", "Tôi gọi một ly cà phê và một chiếc bánh sandwich.")),
            new SeedSense("noun", "B1", "the arrangement of things in a sequence", "thứ tự",
                new SeedExample("Put the words in the correct order.", "Hãy sắp xếp các từ theo đúng thứ tự."))),

        new SeedWord("check", "/tʃek/", "/tʃek/",
            new SeedSense("verb", "A1", "to examine something to make sure it is correct", "kiểm tra",
                new SeedExample("Check your answers before submitting.", "Hãy kiểm tra câu trả lời trước khi nộp.")),
            new SeedSense("noun", "A2", "the bill in a restaurant", "hóa đơn",
                new SeedExample("Can we have the check, please?", "Cho chúng tôi xin hóa đơn được không?"))),

        new SeedWord("mean", "/miːn/", "/miːn/",
            new SeedSense("verb", "A1", "to have a particular meaning", "có nghĩa là",
                new SeedExample("What does this word mean?", "Từ này có nghĩa là gì?"),
                new SeedExample("A red light means you must stop.", "Đèn đỏ có nghĩa là bạn phải dừng lại.")),
            new SeedSense("adjective", "B1", "unkind or cruel", "độc ác, xấu tính",
                new SeedExample("That was a mean joke.", "Đó là một trò đùa độc ác."))),

        new SeedWord("mind", "/maɪnd/", "/maɪnd/",
            new SeedSense("noun", "A1", "the part of a person that thinks and feels", "tâm trí",
                new SeedExample("Keep an open mind when you learn something new.", "Hãy giữ tâm trí cởi mở khi học điều mới.")),
            new SeedSense("verb", "B1", "to feel annoyed or bothered by something", "phiền, ngại",
                new SeedExample("Do you mind if I open the window?", "Bạn có phiền không nếu tôi mở cửa sổ?"))),

        new SeedWord("watch", "/wɑːtʃ/", "/wɒtʃ/",
            new SeedSense("verb", "A1", "to look at something for a period of time", "xem, theo dõi",
                new SeedExample("We watched a movie last night.", "Chúng tôi đã xem một bộ phim tối qua.")),
            new SeedSense("noun", "A2", "a small clock worn on the wrist", "đồng hồ đeo tay",
                new SeedExample("My watch is five minutes fast.", "Đồng hồ của tôi chạy nhanh năm phút."))),

        new SeedWord("play", "/pleɪ/", "/pleɪ/",
            new SeedSense("verb", "A1", "to take part in a game or sport", "chơi",
                new SeedExample("The children play football after school.", "Bọn trẻ chơi bóng đá sau giờ học.")),
            new SeedSense("noun", "B1", "a performance in a theater", "vở kịch",
                new SeedExample("We saw a play at the theater last weekend.", "Chúng tôi đã xem một vở kịch ở nhà hát cuối tuần trước."))),

        new SeedWord("work", "/wɜːrk/", "/wɜːk/",
            new SeedSense("verb", "A1", "to do a job or to function correctly", "làm việc; hoạt động",
                new SeedExample("The elevator doesn't work.", "Thang máy không hoạt động."),
                new SeedExample("She works at a software company.", "Cô ấy làm việc ở một công ty phần mềm.")),
            new SeedSense("noun", "A1", "a job or activity done for money", "công việc",
                new SeedExample("I have a lot of work today.", "Hôm nay tôi có rất nhiều việc."))),

        new SeedWord("sound", "/saʊnd/", "/saʊnd/",
            new SeedSense("noun", "A1", "something that you can hear", "âm thanh",
                new SeedExample("I heard a strange sound outside.", "Tôi nghe thấy một âm thanh lạ bên ngoài.")),
            new SeedSense("verb", "B1", "to seem a particular way when heard or described", "có vẻ",
                new SeedExample("That sounds like a good idea.", "Nghe có vẻ là một ý hay."))),

        new SeedWord("charge", "/tʃɑːrdʒ/", "/tʃɑːdʒ/",
            new SeedSense("verb", "B1", "to ask an amount of money for something", "tính phí",
                new SeedExample("The hotel charges twenty dollars a night.", "Khách sạn tính hai mươi đô la một đêm.")),
            new SeedSense("verb", "B1", "to put electricity into a battery", "sạc",
                new SeedExample("I need to charge my phone before we leave.", "Tôi cần sạc điện thoại trước khi chúng ta đi.")),
            new SeedSense("noun", "B1", "a formal accusation of a crime", "lời buộc tội",
                new SeedExample("He denied the charge.", "Anh ta phủ nhận lời buộc tội."))),

        new SeedWord("address", "/əˈdres/", "/əˈdres/",
            new SeedSense("noun", "A1", "the details of where someone lives", "địa chỉ",
                new SeedExample("Please write your address here.", "Vui lòng ghi địa chỉ của bạn ở đây.")),
            new SeedSense("verb", "B1", "to deal with a problem or issue", "giải quyết",
                new SeedExample("We must address this issue before launch.", "Chúng ta phải giải quyết vấn đề này trước khi ra mắt."))),

        new SeedWord("present", "/ˈpreznt/", "/ˈpreznt/",
            new SeedSense("noun", "A2", "a gift given to someone", "món quà",
                new SeedExample("She gave me a birthday present.", "Cô ấy tặng tôi một món quà sinh nhật.")),
            new SeedSense("adjective", "B1", "existing or happening now", "hiện tại",
                new SeedExample("What is your present job?", "Công việc hiện tại của bạn là gì?"))),

        new SeedWord("fly", "/flaɪ/", "/flaɪ/",
            new SeedSense("verb", "A1", "to move through the air", "bay",
                new SeedExample("Birds fly south in winter.", "Chim bay về phía nam vào mùa đông.")),
            new SeedSense("noun", "A2", "a small flying insect", "con ruồi",
                new SeedExample("There is a fly in the room.", "Có một con ruồi trong phòng."))),

        new SeedWord("apple", "/ˈæpl/", "/ˈæpl/",
            new SeedSense("noun", "A1", "a round fruit with red or green skin", "quả táo",
                new SeedExample("I eat an apple every day.", "Tôi ăn một quả táo mỗi ngày."))),

        new SeedWord("coffee", "/ˈkɔːfi/", "/ˈkɒfi/",
            new SeedSense("noun", "A1", "a hot drink made from roasted coffee beans", "cà phê",
                new SeedExample("She drinks coffee every morning.", "Cô ấy uống cà phê mỗi sáng."))),

        new SeedWord("study", "/ˈstʌdi/", "/ˈstʌdi/",
            new SeedSense("verb", "A1", "to learn about a subject", "học",
                new SeedExample("I study English for an hour every day.", "Tôi học tiếng Anh một giờ mỗi ngày.")),
            new SeedSense("noun", "B1", "a piece of research on a subject", "nghiên cứu",
                new SeedExample("The study shows that sleep improves memory.", "Nghiên cứu cho thấy giấc ngủ cải thiện trí nhớ."))),

        new SeedWord("teacher", "/ˈtiːtʃər/", "/ˈtiːtʃə/",
            new SeedSense("noun", "A1", "a person who teaches", "giáo viên",
                new SeedExample("My English teacher is very patient.", "Giáo viên tiếng Anh của tôi rất kiên nhẫn."))),

        new SeedWord("happy", "/ˈhæpi/", "/ˈhæpi/",
            new SeedSense("adjective", "A1", "feeling pleasure or joy", "vui vẻ, hạnh phúc",
                new SeedExample("I am happy to see you again.", "Tôi rất vui khi gặp lại bạn."))),

        new SeedWord("travel", "/ˈtrævl/", "/ˈtrævl/",
            new SeedSense("verb", "A1", "to go from one place to another", "đi lại, du lịch",
                new SeedExample("I want to travel around Vietnam.", "Tôi muốn đi du lịch khắp Việt Nam."))),

        new SeedWord("music", "/ˈmjuːzɪk/", "/ˈmjuːzɪk/",
            new SeedSense("noun", "A1", "sounds arranged in a pleasant way", "âm nhạc",
                new SeedExample("I listen to music while I work.", "Tôi nghe nhạc khi làm việc."))),

        new SeedWord("water", "/ˈwɔːtər/", "/ˈwɔːtə/",
            new SeedSense("noun", "A1", "clear liquid that people drink", "nước",
                new SeedExample("Drink more water when it is hot.", "Uống nhiều nước hơn khi trời nóng."))),

        new SeedWord("morning", "/ˈmɔːrnɪŋ/", "/ˈmɔːnɪŋ/",
            new SeedSense("noun", "A1", "the early part of the day", "buổi sáng",
                new SeedExample("I go for a run every morning.", "Tôi chạy bộ mỗi sáng."))),

        new SeedWord("beautiful", "/ˈbjuːtɪfl/", "/ˈbjuːtɪfl/",
            new SeedSense("adjective", "A1", "very attractive or pleasant", "đẹp",
                new SeedExample("The view from the hill is beautiful.", "Cảnh từ ngọn đồi rất đẹp.")))
    };
}
