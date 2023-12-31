const APIFeatures = require("../utils/apiFeatures");
const Cours = require("../models/cours");
const Professeur = require("../models/professeur");
const Matiere = require("../models/matiere");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");

const VERIFICATION = require("./functions/verificatin");
exports.getCours = catchAsync(async (req, res, next) => {
  let filter = {};
  if (req.params.id) filter = { cours: req.params.id };
  //EXECUTE QUERY
  const features = new APIFeatures(
    Cours.find(filter),

    req.query
  )
    .filter()
    .sort()
    .limitFields()
    .pagination();
  const cours_list = await Cours.find();
  let cours = [];
  for (x of cours_list) {
    let matiere = await Matiere.findById(x.matiere);
    let professeur = await Professeur.findById(x.professeur);
    let cour = await Cours.findById(x._id);
    let cour_info = await cour.getInformation();
    let data = {
      _id: x._id,
      categorie_id: matiere.categorie,
      matiere_id: x.matiere,
      professeur_id: x.professeur,
      matiere: cour_info[8],
      professeur: cour_info[1],
      email: cour_info[2],
      nombre_heures: cour_info[5],
      TH: cour_info[5],
      somme: cour_info[6],
      date: x.date,
      CM: x.types[0].nbh,
      TD: x.types[1].nbh,
      TP: x.types[2].nbh,
      prix: cour_info[7],
      matiere_prix: cour_info[8],
      isSigned: x.isSigned,
      isPaid: x.isPaid,
      startTime: x.startTime,
      finishTime: x.finishTime,
      types: cour_info[9],
    };
    cours.push(data);
  }
  res.status(200).json({
    status: "succès",
    cours,
  });
});

exports.getOneCours = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const cours = await Cours.findById(id);
  if (!cours) {
    return next(
      new AppError("Aucune cours trouvée avec cet identifiant !", 404)
    );
  }
  let cours_info = await cours.getInformation();
  res.status(200).json({
    status: "succès",
    cours_info,
  });
});

/* ==================================================================ADD COURS======================================= */
exports.addCours = catchAsync(async (req, res, next) => {
  const professeur = await Professeur.findById(req.body.professeur);
  const matiere = await Matiere.findById(req.body.matiere);
  if (!professeur) {
    return next(
      new AppError("Aucune enseignant trouvée avec cet identifiant !", 404)
    );
  }
  if (!matiere) {
    return next(
      new AppError("Aucune matiére trouvée avec cet identifiant !", 404)
    );
  }
  const cours_list = await Cours.find({
    professeur: req.body.professeur,
    date: req.body.date,
  });
  const result = VERIFICATION(req.body, cours_list, "enseignant");

  if (result[0] == "failed") {
    console.log(result[0]);
    return next(new AppError(`${result[1]}`, 404));
  }

  /* ------------------------------------------------------ */
  const cours = await Cours.create({
    types: req.body.types,
    date: req.body.date,
    startTime: req.body.startTime,
    professeur: req.body.professeur,
    matiere: req.body.matiere,
  });

  res.status(201).json({
    status: "succès",
    message: `Le cour est ajouté avec succés `,
    cours,
  });
});
/* ======================================================================EDIT COURS ============================================================== */
exports.updateCours = async (req, res, next) => {
  const id = req.params.id;
  const professeur = await Professeur.findById(req.body.professeur);
  const matiere = await Matiere.findById(req.body.matiere);
  if (!professeur) {
    return next(
      new AppError("Aucune enseignant trouvée avec cet identifiant !", 404)
    );
  }
  if (!matiere) {
    return next(
      new AppError("Aucune matiére trouvée avec cet identifiant !", 404)
    );
  }
  const cours_list = await Cours.find({
    _id: { $ne: id },
    professeur: req.body.professeur,
    date: req.body.date,
  });
  const result = VERIFICATION(req.body, cours_list, "enseignant");

  if (result[0] == "failed") {
    console.log(result[0]);
    return next(new AppError(`${result[1]}`, 404));
  }
  const cours = await Cours.findById(id);
  cours.types = req.body.types;
  cours.date = req.body.date;
  cours.startTime = req.body.startTime;
  cours.professeur = req.body.professeur;
  cours.matiere = req.body.matiere;
  await cours.save();
  if (!cours) {
    return next(
      new AppError("Aucune cours trouvée avec cet identifiant !", 404)
    );
  }

  res.status(200).json({
    status: "succès",
    message: `Le cour est modifie avec succés `,
    cours,
  });
};
/* ============================================================METHODS:s============================================ 
-------------------------------------------------------------------- signe one cour------------------
*/
exports.signeCours = async (req, res, next) => {
  const id = req.params.id;
  const cours = await Cours.findByIdAndUpdate(
    id,
    {
      isSigned: "oui",
    },
    {
      new: true,
      runValidators: true,
    }
  );
  res.status(200).json({
    status: "succès",
    message: "Le cours est signé avec succés .",
    cours,
  });
};
/* ============================================================METHODS:s============================================ 
-------------------------------------------------------------------- paid one cour------------------
*/
exports.paidCours = async (req, res, next) => {
  const id = req.params.id;
  const cours = await Cours.findByIdAndUpdate(
    id,
    {
      isPaid: "oui",
    },
    {
      new: true,
      runValidators: true,
    }
  );
  res.status(200).json({
    status: "succès",
    message: "Le cours est paye avec succés .",
    cours,
  });
};
/* -------------------------------------------------------------------- signe all cours not signe------------------ */
exports.signeAllCours = async (req, res, next) => {
  const id = req.params.id;
  const all_cours = await Cours.find({ isSigned: "pas encore" });
  all_cours.forEach(async (elm) => {
    await Cours.findByIdAndUpdate(
      elm._id,
      {
        isSigned: "oui",
      },
      {
        new: true,
        runValidators: true,
      }
    );
  });
  res.status(200).json({
    status: "succès",
    message: "Tous les cours sont signé .",
  });
};
/* =============================================================REMOVE BY ID======================================= */
exports.deleteCours = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const cours = await Cours.findByIdAndDelete(id);
  if (!cours) {
    return next(
      new AppError("Aucune cours trouvée avec cet identifiant !", 404)
    );
  }
  res.status(200).json({
    status: "succès",
    message: "Le cours est supprimée avec succés .",
  });
});

exports.getNotPaidCours = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const cours = await Cours.aggregate([
    {
      $match: {
        isPaid: "pas encore",
      },
    },
    {
      $group: {
        _id: "professeur",
      },
    },
  ]);

  res.status(200).json({
    status: "succès",
    count: cours.length,
    cours,
  });
});
exports.getPaidCours = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const cours = await Cours.find().populate([
    {
      path: "professeur",
    },
    {
      path: "matiere",
    },
  ]);

  res.status(200).json({
    status: "succès",
    cours,
  });
});

exports.getAllCoursProf = catchAsync(async (req, res, next) => {
  let cours = [];
  let data = {};
  let cours_list = [];
  const professeur = await Professeur.findById(req.params.id);
  if (!professeur) {
    return next(
      new AppError("Aucune enseignant trouvée avec cet identifiant !", 404)
    );
  }
  let prof_info = await professeur.getInformation();
  let prof = {
    _id: prof_info[0],
    nom: prof_info[1],
    prenom: prof_info[2],
    email: prof_info[3],
    mobile: prof_info[4],
    nbh: prof_info[5],
    th: prof_info[6],
    nbc: prof_info[7],
    somme: prof_info[8],
  };

  //total non paid ---------------------------------------------------------------------
  if (!req.body.debit && !req.body.fin) {
    cours_list = await Cours.find({
      professeur: req.params.id,
      isSigned: "oui",
      isPaid: "pas encore",
    }).sort({ date: 1 });
  } else {
    //total beetwen intervell temps--------------------------------------------------------------------
    cours_list = await Cours.find({
      professeur: req.params.id,
      date: { $gte: req.body.debit, $lte: req.body.fin },
      isSigned: "oui",
      isPaid: "pas encore",
    }).sort({ date: 1 });
  }
  for (x of cours_list) {
    let matiere = await Matiere.findById(x.matiere);
    let cour = await Cours.findById(x._id);
    let cour_info = await cour.getInformation();
    let data = {
      _id: x._id,
      categorie_id: matiere.categorie,
      matiere_id: x.matiere,
      professeur_id: x.professeur,
      matiere: cour_info[8],
      professeur: cour_info[1] + " " + cour_info[2],
      email: cour_info[3],
      nombre_heures: cour_info[5],
      TH: cour_info[6],
      somme: cour_info[7],
      date: x.date,
      CM: x.types[0].nbh,
      TD: x.types[1].nbh,
      TP: x.types[2].nbh,
      prix: cour_info[8],
      matiere_prix: cour_info[9],
      isSigned: x.isSigned,
      isPaid: x.isPaid,
      startTime: x.startTime,
      finishTime: x.finishTime,
    };
    cours.push(data);
  }
  res.status(200).json({
    status: "succès",
    first_cours_date: cours[0].date,
    last_cours_date: cours[cours.length - 1].date,
    professeur: prof,
    cours,
  });
});