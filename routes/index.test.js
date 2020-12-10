var app = require("../app");
var request = require("supertest");

test("signup", async (done) => {
  await request(app)
    .post("/sign-up")
    .send({
      usernameFromFront: "John",
      passwordFromFront: "Hello",
      secret_question: "Quel est le nom de votre premier animal de compagnie?",
      secret_question_answer: "Toto",
    })
    .expect(200)
    .expect({ result: false, saveUser: null, error: ["utilisateur déjà présent"] });

  done();
});

test("signup", async (done) => {
  await request(app)
    .post("/sign-up")
    .send({
      usernameFromFront: "Travolta",
      passwordFromFront: "Hello2",
      secret_question: "Quel est le nom de votre premier animal de compagnie?",
      secret_question_answer: "John",
    })
    .expect(200);

  done();
});
