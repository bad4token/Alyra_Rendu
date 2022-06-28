// SPDX-License-Identifier: GPL-3.0

pragma solidity 0.8.14;

import "@openzeppelin/contracts/access/Ownable.sol";    // import de la lib @openzeppelin / Ownable
import "@openzeppelin/contracts/utils/Strings.sol";     // import de la lib @openzeppelin / Strings


contract Voting is Ownable {

    //========================================================================
    //VARIABLE

    //my
    uint voterNbOk;     // nombre total de personne ayant voté, par defaut =0
    uint countMax;
    uint proposalId;    // contient l'ID de la proposition en cours, par defaut =0

    struct Voter {
        bool isRegistered;
        bool hasVoted;
        uint votedProposalId;
    }

    //my
    mapping(address => Voter) Voters;
    address[] votersList;

    struct Proposal {
        string description;
        uint voteCount;
    }

    //my
    mapping(uint => Proposal) Proposals;

    enum WorkflowStatus {
        RegisteringVoters,              // 0
        ProposalsRegistrationStarted,   // 1
        ProposalsRegistrationEnded,     // 2
        VotingSessionStarted,           // 3
        VotingSessionEnded,             // 4
        VotesTallied                    // 5
    }

    //my
    WorkflowStatus stepId;
    mapping(WorkflowStatus => string) stepIds;

    uint winningProposalId = 9999;    // contiendra l'ID de la proposition gagnante, par defaut =9999

 
    //========================================================================
    //EVENT
    event VoterRegistered(address voterAddress); 
    event WorkflowStatusChange(WorkflowStatus previousStatus, WorkflowStatus newStatus);
    event ProposalRegistered(uint proposalId);
    event Voted (address voter, uint proposalId);
    //my
    event WinningProposalId (uint winnerProposalId);

    //========================================================================
    //CONTRUCTOR
    constructor() {
        stepIds[WorkflowStatus.RegisteringVoters] = "RegisteringVoters";
        stepIds[WorkflowStatus.ProposalsRegistrationStarted] = "ProposalsRegistrationStarted";
        stepIds[WorkflowStatus.ProposalsRegistrationEnded] = "ProposalsRegistrationEnded";
        stepIds[WorkflowStatus.VotingSessionStarted] = "VotingSessionStarted";
        stepIds[WorkflowStatus.VotingSessionEnded] = "VotingSessionEnded";
        stepIds[WorkflowStatus.VotesTallied] = "VotesTallied";
    }

    //========================================================================
    //MODIFIER
    modifier isProposalExist(uint _ProposalId) {
        require(_ProposalId < proposalId, string(abi.encodePacked(unicode"Proposition ID inexistante. Veuillez choisir une proposition entre [0] et [",Strings.toString(proposalId-1), "]")));
        _;
    }
    modifier isVoterExist(uint _id) {
        require(_id < votersList.length, string(abi.encodePacked(unicode"Voter ID inexistant. Veuillez choisir un voter entre [0] et [",Strings.toString(votersList.length-1), "]")));
        _;
    }


    //========================================================================
    // FUNCTION SETTER

    //[ONLYOWNER] Fonction permettant de faire progresser le systeme de vote selon les différents statut exitants + control des conditions
    function S0_activeNextStep() external onlyOwner {
        bool upStep = false;

//        require(uint(stepId) < 6, unicode"Le système de vote a été annulé, merci de votre compréhension !");

        //[stepId=0] RegisteringVoters -> ProposalsRegistrationStarted
        if(uint(stepId) == 0){
            require(votersList.length > 0, unicode"Erreur 'RegisteringVoters' -> 'ProposalsRegistrationStarted' : il n'y a encore aucune personne inscrite, veuillez d'abord inscrire des personnes! [S1_addVoter]");
            require(uint(stepId) == 0, unicode"La periode d'inscription de nouveaux votants 'RegisteringVoters' est déjà fermé !");
            upStep = true;
        }

        //[stepId=1] ProposalsRegistrationStarted -> ProposalsRegistrationEnded
        if(uint(stepId) == 1){
            require(proposalId > 0, unicode"Erreur 'ProposalsRegistrationStarted' -> 'ProposalsRegistrationEnded' : il n'y a pas encore eu de propositions, veuillez d'abord attendre des propositions! [S2_addProposal]");
            upStep = true;
        }

        //[stepId=2] ProposalsRegistrationEnded -> VotingSessionStarted
        if(uint(stepId) == 2){
            require(proposalId > 0, unicode"Erreur 'ProposalsRegistrationEnded' -> 'VotingSessionStarted' : il n'y a pas de proposition pour pouvoir voter, veuillez d'abord faire des propositions! [S2_addProposal]");
            upStep = true;
        }

        //[stepId=3] VotingSessionStarted -> VotingSessionEnded
        if(uint(stepId) == 3){
            require(proposalId > 0, unicode"Erreur 'VotingSessionStarted' -> 'VotingSessionEnded' : il n'y a pas encore eu de vote pour pouvoir passer au comptage, veuillez d'abord faire des votes! [S3_setMyVote]");
            upStep = true;
        }

        //[stepId=4] VotingSessionEnded -> VotesTallied
        if(uint(stepId) == 4){
            require(proposalId > 0, unicode"Erreur 'VotingSessionEnded' -> 'VotesTallied' : il n'y a pas de comptage possible car il n'y a pas eu de vote, veuillez d'abord faire des votes! [S3_setMyVote]");
            upStep = true;
        }

        //[stepId=5] VotesTallied
        if(uint(stepId) == 5){
            require(winningProposalId < 0, unicode"Le vote est terminé, merci pour votre participation !");
        }

        // Action et publication d'un event
        if(upStep==true){
            // publication d'un event : Indication d'un changement de statut de la session de vote
            emit WorkflowStatusChange(WorkflowStatus (uint (stepId)), WorkflowStatus (uint (stepId) + 1));
            stepId = WorkflowStatus (uint (stepId) + 1);
        }
    }


    //[ONLYOWNER] fonction qui permet d'ajouter des votants qui pourront faire des propositions et voter
    function S1_addVoter(address _voterAddr) external onlyOwner {
        require(_voterAddr != address(0), unicode"Veuillez saisir une adresse valide pour pouvoir vous inscrire !");
        require(uint(stepId) < 6, unicode"Le système de vote a été annulé, merci de votre compréhension !");
        require(uint(stepId) < 1, unicode"La periode d'inscription de nouveaux votants est maintenant fermé, veuillez faire des propositions et/ou voter !");
        require(Voters[_voterAddr].isRegistered == false, unicode"Cette personne est déjà inscrite pour voter. Attention ici pas de tricherie !");

        // On mémorise l'addresse du votant
        votersList.push(_voterAddr);

        // Valeurs defaut du nouveau votant inscrit
        Voters[_voterAddr].isRegistered = true;
        Voters[_voterAddr].hasVoted = false;
        Voters[_voterAddr].votedProposalId = 0;

        // publication d'un event : Ajout d'un nouveau votant
        emit VoterRegistered(_voterAddr);
    }


    //[EXTERNAL] fonction de collect des propositions, pour les inscrits uniquement
    function S2_addProposal(string calldata _description) external {
        require(Voters[msg.sender].isRegistered == true, unicode"Vous n'etes pas inscrit pour pouvoir faire une proposition, veuillez demander à l'organisateur (owner) de vous inscrire !");
        require(uint(stepId) > 0, unicode"Veuillez attendre la cloture des inscriptions et l'ouverture des propositions avant de pourvoir faire des propositions !");
        require(bytes(_description).length != 0, unicode"Veuillez saisir une proposition non vide !");
        require(uint(stepId) < 2, unicode"La periode pour faire des propositions est maintenant terminé, vous pouvez maintenant passer au vote !");

        // ajout de la proposition au tableau des propositions
        Proposals[proposalId] = Proposal(_description, 0);

        // publication d'un event : Ajout d'une proposition soumis au vote
        emit ProposalRegistered(proposalId);

        // incrementation de l'Id en cours
        proposalId++;
    }


    //[ALL] Fonction d'enregistrement du vote de l'utilisateur
    function S3_setMyVote(uint _votedProposalId) external {
        require(uint(stepId) > 2, unicode"Veuillez attendre l'ouverture des votes. Pour passer au status 'VotingSessionStarted' appuyez sur [S0_activeNextStep] !");
        require(Voters[msg.sender].isRegistered == true, unicode"Vous n'etes pas inscrit pour pouvoir voter, veuillez demander à l'organisateur (owner) de vous inscrire !");
        require(Voters[msg.sender].hasVoted == false, unicode"Vous avez déjà voté petit voyoux !");
        require(_votedProposalId < proposalId, string(abi.encodePacked(unicode"Proposition inexistante. Veuillez choisir une proposition entre [0] et [",Strings.toString(proposalId-1), "]")));
        require(uint(stepId) < 4, unicode"La periode pour faire un vote est maintenant terminé, vous pouvez maintenant passer au dépouillement !");

        // enregistrement du vote pour l'utilisateur
        Voters[msg.sender].hasVoted = true;
        Voters[msg.sender].votedProposalId = _votedProposalId;
        Proposals[_votedProposalId].voteCount++;

        // stat
        voterNbOk++;

        // publication d'un event : Publication du vote d'un utilisateur
        emit Voted (msg.sender, _votedProposalId);

    }


    //[ONLYOWNER] Fonction qui permet de determiner la proposition gagnante
    function S4_doTallied() external onlyOwner returns(uint) {
        require(uint(stepId) > 4, unicode"Veuillez passer au status 'VotesTallied' en appuyant sur [S0_activeNextStep] !");
        require(uint(winningProposalId) < 1234567890, unicode"Le dépouillement a été fait mais il y plusieurs propositions qui ont reçu le même nombre de vote ! Pas de winner unique :(");
        require(uint(winningProposalId) == 9999, unicode"Le dépouillement a déjà été fait et le gagnant est connu. Cliquez sur [G5_getWinner] pour voir le résultat ! :)");

        uint winnerDoublon;
        
        // boucle de l'enfer
        for(uint i = 0; i < proposalId; i++){
            if(Proposals[i].voteCount == countMax) {
                winnerDoublon++;
            }
            if(Proposals[i].voteCount > countMax) {
                winningProposalId = i;
                countMax = Proposals[i].voteCount;
                winnerDoublon = 1;
            } else {

            }
        }

        if(winnerDoublon>1)
        {
            winningProposalId = 1234567890;
        }
        else {
            // publication d'un event : Proposition gagnante car unique
            emit WinningProposalId (winningProposalId);
        }

        return winningProposalId;
    }

    //[ONLYOWNER] Fonctions de resest/restart
    function S5_ResetProposals() external onlyOwner {
        for(uint i=0; i<proposalId; i++){
            delete Proposals[i];    //mapping
        }
        proposalId = 0;
    }
    function S6_ResetVoters() external onlyOwner {
        for(uint i=0; i<votersList.length; i++){
            delete Voters[votersList[i]];    //mapping
        }
        delete votersList;                  //array
    }
    function S7_RestartVote() external onlyOwner {
//    stepId = 0;
        voterNbOk = 0;
        countMax = 0;
        winningProposalId = 9999;

    }

    //========================================================================
    // FUNCTION GETTER

    //[ALL] Fonction qui retourne le statut actuel de la session de vote
    function G0_getStepActive() external view returns(string memory){
        return string(abi.encodePacked(unicode"Phase en cours : ", stepIds[stepId], " (id=", Strings.toString(uint(stepId)),")"));
    }


    //[ALL] Fonction qui renvoi des info sur un voteur via son Id
    function G1_getInfoVoter(uint _id) external view isVoterExist(_id) returns(string memory) {
        address info_addr = votersList[_id];

        string memory res;
        string memory info_isRegistered;
        string memory info_hasVoted;

        if(Voters[info_addr].isRegistered==true){
            info_isRegistered = "true";
        } else {
            info_isRegistered = "false";
        }

        if(Voters[info_addr].hasVoted==true){
            info_hasVoted = "true";
        } else {
            info_hasVoted = "false";
        }

        uint info_votedProposalId = Voters[info_addr].votedProposalId;

        res = string(abi.encodePacked("isRegistered=", info_isRegistered, ", hasVoted=", info_hasVoted, ", votedProposalId=", Strings.toString(info_votedProposalId)));

        return res;
    }


    //[ALL] Fonction qui retourne la liste coplte des propositions/id disponibles pour le vote
    function G2_getListProposals() external view returns(string memory){
        string memory res;
        for(uint i=0; i<proposalId; i++)
        {
             res = string(abi.encodePacked(res, unicode"id=",Strings.toString(i), unicode" : ", Proposals[i].description, " | "));
        }
        return res;
    }


    //[ALL] Fonction qui retourne le nombre actuel de votants inscrits
    function G2_getNbProposal() external view returns(uint) {
        return proposalId;
    }


    //[ALL] Fonction qui retourne le nombre de vote qu'a reçu une proposition
    function G2_getProposalScore(uint _proposalId) external view isProposalExist(_proposalId) returns(string memory) {
        string memory res;
        res = string(abi.encodePacked("Proposition id=", Strings.toString(_proposalId), unicode" a reçu " , Strings.toString(Proposals[_proposalId].voteCount), " vote(s)"));
        return res; 
    }


    //[ALL] Fonction qui retourne pour l'utilisateur qui le demande le statut de son vote (true/false)
    function G3_getMyVote() external view returns(string memory) {

        string memory res;

        if(Voters[msg.sender].hasVoted==true){
            res = string(abi.encodePacked(res, unicode"Vous avez voté la proposition n°",Strings.toString(Voters[msg.sender].votedProposalId), " !"));
        } else {
            res = unicode"Vous n'avez pas encore voté !";
        }

        return res;
    }


    //[ALL] Fonction qui retourne le nombre de voteur inscrit
    function G3_getNbVoters() external view returns(uint) {
        return votersList.length;
    }


    //[ALL] Fonction qui retourne quelques stats des votes après dépouillement (participation/inscrit...)
    function G4_getStatVoters() external view returns(string memory) {
        require(uint(stepId) == 5, unicode"Veuillez d'abord procéder au dépouillement 'VotesTallied' avant de pourvoir faire des statistiques sur les votes !");

        string memory res = string(abi.encodePacked(unicode"Personnes ayant votés = ",Strings.toString(voterNbOk), unicode" / Personnes inscrites = ", Strings.toString(votersList.length)));
        return res;
    }


    //[ALL] Fonction qui retourne Id+Description de la proposition gagnante
    function G5_getWinner() external view returns(string memory){
        require(uint(stepId) > 4, unicode"Veuillez passer au status 'VotesTallied' en appuyant sur [S0_activeNextStep] !");
        require(uint(winningProposalId) < 1234567890, unicode"Le dépouillement a été fait mais il y plusieurs propositions qui ont reçu le même nombre de vote ! Pas de winner unique :(");
        require(uint(winningProposalId) < 9999, unicode"Veuillez d'abord faire le dépouillement ! [S4_doTallied]");
        string memory res = string(abi.encodePacked(unicode"Voté ", Strings.toString(Proposals[winningProposalId].voteCount), unicode" fois : Proposition gagnante n°",Strings.toString(winningProposalId), unicode" = ", Proposals[winningProposalId].description));
        return res;
    }

}