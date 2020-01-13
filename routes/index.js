var express = require('express');
var router = express.Router();

const admin = require('firebase-admin');
let serviceAccount = require('../foodfatguy-4318ab597923.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://foodfatguy.firebaseio.com"
});

let db = admin.firestore();

var cartData = [];
var cartID = [];
var productData = [];
var productInfo = [];
var docId;
var memberId;
var countDuplicated = 0;

/* 網站首頁 */
router.get('/', function(req, res, next) {
  console.log(req.session.memberId);
  var docRef = db.collection("products");
  productData = [];
  docRef.orderBy('ID').get().then(function(querySnapshot) {
    querySnapshot.forEach(function (doc) {
      productData.push(doc.data())
    });
    res.render('index', { 
      title: 'Product List', 
      data: productData,
      sessionData: req.session.memberId
    })
  })
});

// 我的訂單
router.get('/orderlist', function(req, res, next) {
  var orderRef = db.collection("order");
  let timeData = [];
  let totalPriceData = [];
  let docID = [];
  var username = req.query.memberId;
  console.log(username);
  orderData = [];
  orderRef.where('memberID', '==', username).get().then(function(querySnapshot) {
    querySnapshot.forEach(function (doc) {
      var year = doc.data().orderTime.toDate().getFullYear();
      var month = doc.data().orderTime.toDate().getMonth()+1;
      var date = doc.data().orderTime.toDate().getDate();
      var hour = doc.data().orderTime.toDate().getHours();
      var minute = doc.data().orderTime.toDate().getMinutes();
      var second = doc.data().orderTime.toDate().getSeconds();

      if(Number(month<10))
        month = '0'+month;
      if(Number(date<10))
        date = '0'+date;
      if(Number(hour<10))
        hour = '0'+hour;
      if(Number(minute<10))
        minute = '0'+minute;
      if(Number(second<10))
        second = '0'+second;

      var str = year+'/'+month+'/'+date+' '+hour+':'+minute+':'+second;
      var sum = 0;

      for(var i=0 ; i<doc.data().name.length ; i++){
        sum += doc.data().price[i] * doc.data().quantity[i]
      }
      orderData.push(doc.data());
      timeData.push(str);
      totalPriceData.push(sum);
      docID.push(doc.id);
    });
    if(req.session.memberId != undefined){
      res.render('orderlist', { 
        title: '我的訂單總覽', 
        data: orderData, timeData, totalPriceData, docID,
        sessionData: req.session.memberId
      })
    }
    else{
      res.redirect("/");
    }
  })
});


/* 搜尋結果頁 */
router.get('/search', function(req, res, next) {
  var docRef = db.collection("products");
  let productData = [];

  let keyword = req.query.keyword || undefined;
  if(keyword == ""){
    keyword = undefined;
  }
  let order = req.query.orderBy || undefined; 
  if(order == ""){
    order = undefined;
  }
  let category = Number(req.query.category) || undefined;
  if(category == ""){
    category = undefined;
  }
  /* 沒有關鍵字、排序方式 */
  if(keyword == undefined && order == undefined){
    docRef.get().then(function (querySnapshot) {
      querySnapshot.forEach(function (doc) {
        productData.push(doc.data())
      });
      if(category != undefined && category % 1 != 0){
        productData = productData.filter(function(item) {
          return item.typeID == category;
        });
      }else if(category != undefined && category % 1 == 0){
        productData = productData.filter(function(item) {
          return item.typeID >= category && item.typeID < category+1;
        });        
      }
      res.render('search', { title: 'Search result', productData: productData, sessionData: req.session.memberId });
    })
  }
  /* 只有關鍵字 */
  if(keyword != undefined && order == undefined){
    docRef.get().then(function (querySnapshot) {
      querySnapshot.forEach(function (doc) {
        productData.push(doc.data())
      });
      productData = productData.filter(function(item) {
        return item.name.includes(keyword);
      });
      if(category != undefined && category % 1 != 0){
        productData = productData.filter(function(item) {
          return item.typeID == category;
        });
      }else if(category != undefined && category % 1 == 0){
        productData = productData.filter(function(item) {
          return item.typeID >= category && item.typeID < category+1;
        });        
      }
      res.render('search', { title: 'Search result', productData: productData, sessionData: req.session.memberId });
    })
  }
  /* 價格由低到高排序 */
  if(keyword == undefined && order == "price"){
    docRef.orderBy("price").get().then(function (querySnapshot) {
      querySnapshot.forEach(function (doc) {
        productData.push(doc.data())
      });
      if(category != undefined && category % 1 != 0){
        productData = productData.filter(function(item) {
          return item.typeID == category;
        });
      }else if(category != undefined && category % 1 == 0){
        productData = productData.filter(function(item) {
          return item.typeID >= category && item.typeID < category+1;
        });        
      }
      res.render('search', { title: 'Search result', productData: productData, sessionData: req.session.memberId });
    })
  }
  /* 價格由高到低排序 */
  if(keyword == undefined && order == "priceDesc"){
    docRef.orderBy("price",'desc').get().then(function (querySnapshot) {
      querySnapshot.forEach(function (doc) {
        productData.push(doc.data())
      });
      if(category != undefined && category % 1 != 0){
        productData = productData.filter(function(item) {
          return item.typeID == category;
        });
      }else if(category != undefined && category % 1 == 0){
        productData = productData.filter(function(item) {
          return item.typeID >= category && item.typeID < category+1;
        });
      }
      res.render('search', { title: 'Search result', productData: productData, sessionData: req.session.memberId });
    })
  }
  /* 關鍵字+價格由低到高排序 */
  if(keyword != undefined && order == "price"){
    docRef.orderBy("price").get().then(function (querySnapshot) {
      querySnapshot.forEach(function (doc) {
        productData.push(doc.data())
      });
      productData = productData.filter(function(item) {
        return item.name.includes(keyword);
      });
      if(category != undefined && category % 1 != 0){
        productData = productData.filter(function(item) {
          return item.typeID == category;
        });
      }else if(category != undefined && category % 1 == 0){
        productData = productData.filter(function(item) {
          return item.typeID >= category && item.typeID < category+1;
        });
      }
      res.render('search', { title: 'Search result', productData: productData, sessionData: req.session.memberId });
    })
  }
  /* 關鍵字+價格由高到低排序 */
  if(keyword != undefined && order == "priceDesc"){
    docRef.orderBy("price",'desc').get().then(function (querySnapshot) {
      querySnapshot.forEach(function (doc) {
        productData.push(doc.data())
      });
      productData = productData.filter(function(item) {
        return item.name.includes(keyword);
      })
      if(category != undefined && category % 1 != 0){
        productData = productData.filter(function(item) {
          return item.typeID == category;
        });
      }else if(category != undefined && category % 1 == 0){
        productData = productData.filter(function(item) {
          return item.typeID >= category && item.typeID < category+1;
        });
      }
      res.render('search', { title: 'Search result', productData: productData, sessionData: req.session.memberId });
    })
  }
});

/* 商品管理 */
router.get('/products', function(req, res, next) {
  var docRef = db.collection("products");
  productData = [];
  docRef.orderBy('ID').get().then(function(querySnapshot) {
    querySnapshot.forEach(function (doc) {
      productData.push(doc.data())
    });
    if(req.session.memberId == 'admin'){
      res.render('products', { 
        title: 'Product List', 
        data: productData,
        sessionData: req.session.memberId
      })
    }
    else{
      console.log("非法登入");
      res.redirect("/");
    }

  })
});

router.get('/customer', function(req, res, next) {
  var docRef = db.collection("products");
  productData = [];
  docRef.orderBy('ID').get().then(function(querySnapshot) {
    querySnapshot.forEach(function (doc) {
      productData.push(doc.data())
    });
    res.render('customer', { 
      title: 'Product List', 
      data: productData,
      memberId: req.session.memberId
    })
  })
});

/* 登入頁面 */
router.get('/login', function(req, res, next) {
  res.render('login', { title: '會員登入', memberId: req.session.memberId });
});

/* 零嘴類 */
router.get('/snacks', function(req, res, next) {
  var docRef = db.collection("products");
  let productData = [];
  docRef.where("typeID", "==", 1.1).get().then(function (querySnapshot) {
    querySnapshot.forEach(function (doc) {
      productData.push(doc.data())
    });
    res.render('snacks', { title: '零嘴', data: productData, sessionData: req.session.memberId });
  })
});

/* 飲料類 */
router.get('/beverage', function(req, res, next) {
  var docRef = db.collection("products");
  let productData = [];
  docRef.where("typeID", "==", 1.2).get().then(function (querySnapshot) {
    querySnapshot.forEach(function (doc) {
      productData.push(doc.data())
    });
    res.render('beverage', { title: '飲料', data: productData, sessionData: req.session.memberId });
  })
});

/* 冷凍食品類 */
router.get('/frozenfood', function(req, res, next) {
  var docRef = db.collection("products");
  let productData = [];
  docRef.where("typeID", "==", 2.1).get().then(function (querySnapshot) {
    querySnapshot.forEach(function (doc) {
      productData.push(doc.data())
    });
    res.render('frozenfood', { title: '冷凍食品', data: productData, sessionData: req.session.memberId });
  })
});

/* 調理方便包類 */
router.get('/ready-to-eat', function(req, res, next) {
  var docRef = db.collection("products");
  let productData = [];
  docRef.where("typeID", "==", 2.2).get().then(function (querySnapshot) {
    querySnapshot.forEach(function (doc) {
      productData.push(doc.data())
    });
    res.render('ready-to-eat', { title: '調理方便包', data: productData, sessionData: req.session.memberId });
  })
});

/* 使用者登出 */
router.post('/logout', function (req, res, next) {
  req.session.destroy();
  cartData = [];
  memberId = undefined;
  console.log('登出成功');
  res.redirect("/");
});

/* 註冊頁面 */
router.get('/register', function(req, res, next) {
  res.render('register', { title: '會員註冊' });
});

/* 使用者個人頁面 */
router.get('/user', function(req, res, next) {
  res.render('user', { title: '個人頁面' });
});

/* 購物車頁面 */
router.get('/cart', function(req, res, next) {
  if(memberId == undefined)
    res.redirect("/");
  var cartRef = db.collection('member').doc(memberId).collection('cart');
  
  cartData = [];
  cartID = [];
  cartRef.get().then(function(querySnapshot) {
    querySnapshot.forEach(function (doc) {
      cartData.push(doc.data());
      cartID.push(doc.id);
    });
    var count = cartID.length;
    console.log(count);
    console.log(memberId);
    res.render('cart', { title: '購物車列表', lengthData: count, cartData: cartData, data: cartID, sessionData: req.session.memberId });
  })
});

/* 結帳頁面 */
router.get('/checkout', function(req, res, next) {
  res.render('checkout', { title: '結帳頁面', cartData: cartData, sessionData: req.session.memeberId });
});

router.post('/chk', function (req, res, next) {
  if(req.body.pwd == req.body.cpwd){
    var regRef = db.collection('member');
    regRef.add({
      "account": req.body.acc,
      "name": req.body.name,
      "password": req.body.pwd
    }).then(function(){
      console.log('註冊成功，跳轉回首頁');
      res.redirect("/");
    })
  }
  else {
    console.log('註冊密碼不同，請重新註冊');
    res.redirect("/register");
  }
});

/* 訂單頁面 */
router.get('/order', function(req, res, next) {
  res.render('order', { title: '結帳頁面', cartData: cartData });
});

/* 使用者註冊 */
router.post('/reg', function (req, res, next) {
  console.log("註冊驗證機制判斷中：");
  if(req.body.pwd == req.body.cpwd){
    var regRef = db.collection('member');

    regRef.get().then(function (querySnapshot) {
      querySnapshot.forEach(function (doc) {
        console.log("現有帳戶 "+doc.data().account);
        console.log("nowreg "+req.body.acc);
        if(req.body.acc == doc.data().account){
          console.log("偵測到重覆帳號");
          countDuplicated++;
        }
      });
      console.log(countDuplicated);
      if(countDuplicated == 0){
        regRef.add({
          "account": req.body.acc,
          "name": req.body.name,
          "password": req.body.pwd
        }).then(function(){
          console.log('註冊成功，跳轉回首頁');
          res.redirect("/");
        })
      }
      else{
        countDuplicated = 0;
        console.log("此帳號名稱已被註冊，請更換一個！");
        res.redirect("/register");
      }  
    })
  }
  else{
    console.log('註冊密碼不同，請重新註冊');
    res.redirect("/register");
  }
  
});

/* 使用者登入 */
router.post('/login', function (req, res) {
  var memberRef = db.collection('member');
  memberRef.where('account', '==', req.body.account).get().then(function (querySnapshot) { 
    querySnapshot.forEach(function (doc) {
      if (doc.data().password == req.body.password){
        let cartRef = db.collection('member').doc(doc.id).collection('cart');
        cartRef.get().then(function (querySnapshot) {
          querySnapshot.forEach(function (doc) {
            cartData.push(doc.data());
          });
          req.session.memberId = doc.data().name;
          memberId = doc.id;
          console.log('登入成功');
          if(doc.data().name != "admin")
            res.redirect('/');
          else
            res.redirect('/products');
        })
      }
      else{
        console.log('帳號或密碼錯誤'); 
        res.redirect('/login');
      }
    });
  })
})

/* 新增產品頁面 */
router.post('/products/createProduct', function(req, res, next) {
  res.render('productsCreate', { title: '新增產品頁面', sessionData: req.session.memberId });
});

/* 後台新增產品 */
router.post('/products/create', function (req, res, next){
  var docRef = db.collection('products');
  docRef.add({
    "ID": Number(req.body.id),
    "name": req.body.name,
    "price": Number(req.body.price),
    "typeID": Number(req.body.typeid),
    "photoUrl": req.body.photoUrl,
    "description": req.body.des
  }).then(function(){
    res.redirect("/products");
  })
});

/* 新增產品至購物車 or 直接購買 */
router.post('/products/createCart', function (req, res, next){
  var id = Number(req.body.id);
  var docRef = db.collection('products');
  var cartRef = db.collection('member').doc(memberId).collection('cart');
  var check = 0;

  docRef.where('ID','==',id).get().then(function(querySnapshot) {
    querySnapshot.forEach(function (doc) {

      cartRef.where('name','==',doc.data().name).get().then(function(querySnapshot) {
        querySnapshot.forEach(function (docc) {
          cartRef.doc(docc.id).update({
            "quantity": Number(Number(docc.data().quantity)+Number(req.body.amount))
          }).then(function(){
            check++;
          });
        });
      })
      setTimeout(noDuplicatedAdd,3000);
      function noDuplicatedAdd(){
        if(check == 0){
          cartRef.add({
            "name": doc.data().name,
            "price": doc.data().price,
            "picurl": doc.data().photoUrl,
            "quantity": req.body.amount
          })
        }
      if(req.body.btn == '加入購物車')
        res.redirect("/products/info?id="+id);
      else
        res.redirect("/cart");
      }
    });
  })
});

/* 更新產品頁面 */
router.post('/products/update', function(req, res, next) {
  var docRef = db.collection("products");
  var updateData = [];
  var id = Number(req.body.product_id);

  docRef.where('ID','==',id).get().then(function(querySnapshot) {
    querySnapshot.forEach(function (doc) {
      updateData.push(doc.data());
      docId = doc.id;
      console.log(docId);
    });
    res.render('productsUpdate', { title: '產品資訊更新', docData: docId, data: updateData, sessionData: req.session.memberId })
  })
});

/* 後台更新產品 */
router.post('/products/updates', function(req, res, next) {
  var docRef = db.collection("products");
  var updateID = Number(req.body.id);

  docRef.where('ID','==',updateID).get().then(function(querySnapshot) {
    querySnapshot.forEach(function (doc) {
      docId = doc.id;
      docRef.doc(docId).update({
        "ID": Number(req.body.id),
        "name": req.body.name,
        "price": Number(req.body.price),
        "typeID": Number(req.body.typeid),
        "photoUrl": req.body.photoUrl,
        "description": req.body.des
      }).then(function(){
        res.redirect("/products")
      })
    });
  })
});

/* 刪除商品 */ 
router.post('/products/delete', function(req, res, next) {
  var docRef = db.collection("products");
  var id = Number(req.body.id);

  docRef.where('ID','==',id).get().then(function(querySnapshot) {
    querySnapshot.forEach(function (doc) {
      docId = doc.id;
      docRef.doc(docId).delete().then(function(){
        res.redirect("/products");
      });
    });
  })
});

/* 結帳生成訂單到後台 */
router.post('/cart/checkout', function(req, res, next) {
  var orderRef = db.collection("order");
  var docRef = db.collection("products");
  var product = [];
  var buyer = req.body.buyer;
  var name = req.body.product_name;
  var ordertime = admin.firestore.FieldValue.serverTimestamp();
  // var productID = [];
  var price = req.body.product_price;
  var quantity = req.body.product_quantity;
  var temp;
  // var shippingMethod = '7-11貨到付款';
  var totalPrice = 0;
  var count = Number(req.body.count);

  console.log(count);

  docRef.orderBy('ID').get().then(function(querySnapshot) {
    querySnapshot.forEach(function (doc) {
      product.push(doc.data())
    });

    if(count > 1){
      for(var i=0 ; i<name.length ; i++){
        temp = Number(price[i]);
        price[i] = temp;
        temp = Number(quantity[i]);
        quantity[i] = temp;
        totalPrice += price[i] * quantity[i]
        // for(var j=0 ; j<product.length ; j++){
          // if(name[i] === product[j].name){
            // productID.push(product[j].ID);
            // break;
          // }
        // }
      }
    }else{
      temp = Number(price);
      price = temp;
      temp = Number(quantity);
      quantity = temp;
        totalPrice = price * quantity;
        // for(var j=0 ; j<product.length ; j++){
          // if(name[i] === product[j].name){
            // productID.push(product[j].ID);
            // break;
          // }
        // }
    }
    var cartRef = db.collection('member').doc(memberId).collection('cart');

    cartRef.get().then(function(querySnapshot) {
      querySnapshot.forEach(function (doc) {
        cartRef.doc(doc.id).delete();
      });
    })

    orderRef.add({
      "memberID": buyer,
      "name": name,
      "orderTime": ordertime,
      "price": price,
      // "productID": productID,
      "quantity": quantity,
      // "shippingmethod": shippingMethod,
      "totalPrice": totalPrice
    }).then(function(){
      console.log("購買完成");
      res.redirect("/");
    })
  })
});

/* 刪除購物車 */ 
router.get('/cart/delete', function(req, res, next) {
  var name = req.query.cartID;
  var cartRef = db.collection('member').doc(memberId).collection('cart');

    cartRef.where('name','==',name).get().then(function(querySnapshot) {
      querySnapshot.forEach(function (doc) {
        cartRef.doc(doc.id).delete().then(function(){
          res.redirect("/cart");
        });
      });
    })
});

/* 前往商品資訊 */
router.get('/products/info', function(req, res, next) {
  var foodId = Number(req.query.id);
  var docRef = db.collection("products");
  productInfo = [];

  docRef.where('ID','==',foodId).get().then(function(querySnapshot) {
    querySnapshot.forEach(function (doc) {
      productInfo.push(doc.data());
    });
    res.render('productInfo', { title: '產品資訊', data: productInfo, sessionData: req.session.memberId})
  })
});

// 訂單總覽
router.get('/orderlistAdmin', function(req, res, next) {
  var orderRef = db.collection("order");
  let timeData = [];
  let totalPriceData = [];
  let docArr = [];
  orderData = [];
  orderRef.orderBy('orderTime').get().then(function(querySnapshot) {
    querySnapshot.forEach(function (doc) {
      var year = doc.data().orderTime.toDate().getFullYear();
      var month = doc.data().orderTime.toDate().getMonth()+1;
      var date = doc.data().orderTime.toDate().getDate();
      var hour = doc.data().orderTime.toDate().getHours();
      var minute = doc.data().orderTime.toDate().getMinutes();
      var second = doc.data().orderTime.toDate().getSeconds();

      if(Number(month<10))
        month = '0'+month;
      if(Number(date<10))
        date = '0'+date;
      if(Number(hour<10))
        hour = '0'+hour;
      if(Number(minute<10))
        minute = '0'+minute;
      if(Number(second<10))
        second = '0'+second;

      var str = year+'/'+month+'/'+date+' '+hour+':'+minute+':'+second;
      var sum = 0;

      for(var i=0 ; i<doc.data().name.length ; i++){
        sum += doc.data().price[i] * doc.data().quantity[i]
      }

      orderData.push(doc.data());
      timeData.push(str);
      totalPriceData.push(sum);
      docArr.push(doc.id);
    });
    console.log(docArr);

    if(req.session.memberId == 'admin'){
      res.render('orderlistAdmin', { 
        title: '訂單總覽', 
        data: orderData, timeData, totalPriceData, docArr,
        sessionData: req.session.memberId
      })
    }
    else{
      console.log("非法登入");
      res.redirect("/");
    }


  })
});

//刪除訂單
router.post('/orderlistAdmin/delete', function(req, res, next) {
  var orderRef = db.collection("order");
  var id = req.body.id;

  orderRef.get().then(function(querySnapshot) {
    querySnapshot.forEach(function (doc) {
      if(doc.id === id){
        orderRef.doc(id).delete().then(function(){
          res.redirect("/orderlistAdmin");
        });
      }
    });
  })
});

module.exports = router;
