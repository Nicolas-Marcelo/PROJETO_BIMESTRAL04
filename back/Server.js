const express = require("express");
const app = express();
const cors = require("cors");
const porta = 8080;
const admin = require("firebase-admin");

const serviceAccount = require('./correcttask-firebase-adminsdk-99r4a-5e961435e8.json'); 
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
app.use(cors()); 

app.get('/desafios', async (req, res) => {
  try {
    const colecaoDesafios = db.collection('desafios');
    const colecaoSolucoes = db.collection('solucoes');
    const mostrarDesafios = await colecaoDesafios.get();
    const desafios = await Promise.all(
      mostrarDesafios.docs.map(async (doc) => {
        const desafioData = doc.data();
        const solucaoLista = await Promise.all(
          (desafioData.solucoes || []).map(async (solucaoId) => {
            const solucaoDoc = await colecaoSolucoes.doc(solucaoId).get();
            return { id: solucaoDoc.id, ...solucaoDoc.data() };
          })
        );

        const dataLimite = desafioData.dataLimite && typeof desafioData.dataLimite.toDate === 'function' 
        ? desafioData.dataLimite.toDate() 
        : null;

        return {
          id: doc.id,
          desafio: desafioData.desafio,
          descricao: desafioData.descricao,
          criterios: desafioData.criterios,
          autorId: desafioData.autorId,
          dataLimite,
          recompensa: desafioData.recompensa,
          solucoes: solucaoLista.filter((solucao) => solucao),
        };
      })
    );

    res.json(desafios);
  } catch (error) {
    console.error("A quase 3 passos de saber oque só os loucos sabem, .desafios, node:", error);
  }
});

app.post('/questionario', async (req, res) => {
  const { email, displayName, tipoConta, nomeCompletoUsuario, CPFUsuario, dataNascimentoUsuario, experiencias, conhecimentos } = req.body;

  try {
    const usuarioRef = db.collection('usuarios').doc(email); // Pode ser melhor usar uid ou outro identificador único
    await usuarioRef.set({
      email,
      displayName,
      tipoConta,
      nomeCompletoUsuario,
      CPFUsuario,
      dataNascimentoUsuario,
      questionarioCompleto: true,
      experienciasUsuario: experiencias,
      conhecimentoUsuario: conhecimentos,
    });

    res.status(201).send({ message: 'Questionário enviado com sucesso!' });
    res.send('Deu boa!')
  } catch (error) {
    console.error('Erro ao enviar questionário:', error);
    res.status(500).send({ error: 'Erro ao enviar questionário' });
  }
});

app.listen(porta, () => {
  console.log(`Servidor rodando na porta: ${porta}`)
});


