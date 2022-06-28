// on récupère notre contrat Voting.sol
const Voting = artifacts.require('Voting.sol');

// on récupère aussi les fonctions BN, expectEvent, expectRevert nécessaires au test depuis la librairie @Openzeppelin
const {
    BN,           // Big Number support
    expectEvent,  // Assertions for emitted events
    expectRevert, // Assertions for transactions that should fail
} = require('@openzeppelin/test-helpers');

// on récupère la fonction expect nécessaires au test depuis la librairie Chai
const { expect } = require('chai');

// on créer une instance du contrat
contract("VotingTest", accounts => {
    
    // on récupère dans une constante l'adresse0
    const ownerAddr = accounts[0];
    const noOwnerAddr = accounts[1];
    const voter1Addr = accounts[2];
    const voter2Addr = accounts[3];
    const voter3Addr = accounts[4];

    // on déclare la variable
    let votingInstance;

    describe("VOTING : fulltest", function () {

        //===========================
        context("A] Testing: WorkflowStatus changement (cycle)", function () {
            beforeEach(async function () {
                // deploy instance
                votingInstanceDeployed = await Voting.deployed({from:ownerAddr});
            });

            it("a01   ...I can set 'ProposalsRegistrationStarted' when WorkflowStatus is 'RegisteringVoters' (expectEvent)", async () => {
                const findEvent = await votingInstanceDeployed.startProposalsRegistering({from:ownerAddr});
                expectEvent(findEvent, "WorkflowStatusChange", {previousStatus: new BN(Voting.WorkflowStatus.RegisteringVoters)}, {newStatus: new BN(Voting.WorkflowStatus.ProposalsRegistrationStarted)});
            });

            it("a02   ...I can set 'ProposalsRegistrationEnded' when WorkflowStatus is 'ProposalsRegistrationStarted' (expectEvent)", async () => {
                const findEvent = await votingInstanceDeployed.endProposalsRegistering({from:ownerAddr});
                expectEvent(findEvent, "WorkflowStatusChange", {previousStatus: new BN(Voting.WorkflowStatus.ProposalsRegistrationStarted)}, {newStatus: new BN(Voting.WorkflowStatus.ProposalsRegistrationEnded)});
            });

            it("a03   ...I can set 'VotingSessionStarted' when WorkflowStatus is 'ProposalsRegistrationEnded' (expectEvent)", async () => {
                const findEvent = await votingInstanceDeployed.startVotingSession({from:ownerAddr});
                expectEvent(findEvent, "WorkflowStatusChange", {previousStatus: new BN(Voting.WorkflowStatus.ProposalsRegistrationEnded)}, {newStatus: new BN(Voting.WorkflowStatus.VotingSessionStarted)});
            });

            it("a04   ...I can set 'VotingSessionEnded' when WorkflowStatus is 'VotingSessionStarted' (expectEvent)", async () => {
                const findEvent = await votingInstanceDeployed.endVotingSession({from:ownerAddr});
                expectEvent(findEvent, "WorkflowStatusChange", {previousStatus: new BN(Voting.WorkflowStatus.VotingSessionStarted)}, {newStatus: new BN(Voting.WorkflowStatus.VotingSessionEnded)});
            });

            it("a05   ...I can set 'VotesTallied' when WorkflowStatus is 'VotingSessionEnded' (expectEvent)", async () => {
                const findEvent = await votingInstanceDeployed.tallyVotes({from:ownerAddr});
                expectEvent(findEvent, "WorkflowStatusChange", {previousStatus: new BN(Voting.WorkflowStatus.VotingSessionEnded)}, {newStatus: new BN(Voting.WorkflowStatus.VotesTallied)});
            });

        });


        //===========================
        context("B] Testing all fonctions when status [RegisteringVoters] is active, with all accounts ownerAddr, voter1Addr...", function () {

            beforeEach(async function () {
                // new instance
                votingInstance = await Voting.new({from:ownerAddr});
            });

            it("Confirm [RegisteringVoters] is actual workflowStatus (expect)", async () => {
                const storedData = await votingInstance.workflowStatus.call({from:ownerAddr});
                expect(new BN(storedData)).to.be.bignumber.equal(new BN(0));
            });

            //---[ Test addVoter() ]---
            it("b01   use addVoter() \t\t\t\t✔ 'ownerAddr' \tcan add voter 'voter1Addr' \t\t\texpect", async () => {
                await votingInstance.addVoter(voter1Addr, {from:ownerAddr});
                const storedData = await votingInstance.getVoter(voter1Addr, {from:voter1Addr});
                expect(storedData.isRegistered).to.equal(true);
            });
            it("b02   use addVoter() \t\t\t\t✖ 'voter1Addr' \tcan't add voter 'noOwnerAddr' \t\t\texpectRevert : [onlyOwner]", async () => {
                await expectRevert(votingInstance.addVoter(voter2Addr, {from:noOwnerAddr}), "caller is not the owner.");
            });
            it("b03   use addVoter() \t\t\t\t✔ 'ownerAddr' \tcan add and publish event \t\t\texpectEvent  : Publish event 'VoterRegistered'", async () => {
                const findEvent = await votingInstance.addVoter(voter2Addr, {from:ownerAddr});
                expectEvent(findEvent, "VoterRegistered", {voterAddress: new BN(voter2Addr)});
            });
            it("b04   use addVoter() \t\t\t\t✖ 'ownerAddr' \tcan't re-add same voter 'voter1Addr' \t\texpectRevert : Already registered", async () => {
                await votingInstance.addVoter(voter1Addr, {from:ownerAddr});
                await expectRevert(votingInstance.addVoter(voter1Addr, {from:ownerAddr}), "Already registered");
            });

            //---[ Test addProposal() ]---
            it("b05   use addProposal() \t\t\t✖ 'ownerAddr' \tcan't add proposal \t\t\t\texpectRevert : [onlyVoters]", async () => {
                await expectRevert(votingInstance.addProposal("my proposal", {from:ownerAddr}), "You're not a voter.");
            });
            it("b06   use addProposal() \t\t\t✖ 'voter1Addr' \tcan't add proposal \t\t\t\texpectRevert : [onlyVoters]", async () => {
                await expectRevert(votingInstance.addProposal("my proposal", {from:voter1Addr}), "You're not a voter.");
            });
            it("b07   use addProposal() \t\t\t✖ 'ownerAddr' \tcan't add empty proposal \t\t\texpectRevert : [onlyVoters]", async () => {
                await expectRevert(votingInstance.addProposal("", {from:ownerAddr}), "You're not a voter.");
            });
            it("b08   use addProposal() \t\t\t✖ 'voter1Addr' \tcan't add empty proposal \t\t\texpectRevert : [onlyVoters]", async () => {
                await expectRevert(votingInstance.addProposal("", {from:voter1Addr}), "You're not a voter.");
            });

            //---[ Test setVote() ]---
            it("b09   use setVote() \t\t\t\t✖ 'ownerAddr' \tcan't set vote \t\t\t\t\texpectRevert : [onlyVoters]", async () => {
                await expectRevert(votingInstance.setVote(0, {from:ownerAddr}), "You're not a voter.");
            });
            it("b10   use setVote() \t\t\t\t✖ 'voter1Addr' \tcan't set vote \t\t\t\t\texpectRevert : [onlyVoters]", async () => {
                await expectRevert(votingInstance.setVote(0, {from:voter1Addr}), "You're not a voter.");
            });

            //---[ Test taillyVote() ]---
            it("b11   use tallyVotes() \t\t\t✖ 'ownerAddr' \tcan't tailly vote \t\t\t\texpectRevert : Current status is not voting session ended", async () => {
                await expectRevert(votingInstance.tallyVotes({from:ownerAddr}), "Current status is not voting session ended");
            });
            it("b12   use tallyVotes() \t\t\t✖ 'voter1Addr' \tcan't tailly vote \t\t\t\texpectRevert : [onlyOwner]", async () => {
                await expectRevert(votingInstance.tallyVotes({from:voter1Addr}), "caller is not the owner.");
            });

            //---[ Test getVoter() ]---
            it("b13   use getVoter() \t\t\t\t✖ 'ownerAddr' \tcan't get voter 'voter1Addr' \t\t\texpectRevert : [onlyVoters]", async () => {
                await expectRevert(votingInstance.getVoter(voter1Addr, {from:ownerAddr}), "You're not a voter");
            });
            it("b14   use getVoter() \t\t\t\t✖ 'voter1Addr' \tcan't get voter 'voter2Addr' \t\t\texpectRevert : [onlyVoters]", async () => {
                await expectRevert(votingInstance.getVoter(voter2Addr, {from:voter1Addr}), "You're not a voter");
            });

            //---[ Test getOneProposal() ]---
            it("b15   use getOneProposal() \t\t\t✖ 'ownerAddr' \tcan't get proposal '0' \t\t\t\texpectRevert : [onlyVoters]", async () => {
                await expectRevert(votingInstance.getOneProposal(0, {from:ownerAddr}), "You're not a voter");
            });
            it("b16   use getOneProposal() \t\t\t✖ 'voter1Addr' \tcan't get proposal '0' \t\t\t\texpectRevert : [onlyVoters]", async () => {
                await expectRevert(votingInstance.getOneProposal(0, {from:voter1Addr}), "You're not a voter");
            });

            //---[ ProposalsRegistrationStarted ]---
            it("b17   set 'ProposalsRegistrationStarted' \t✔ 'ownerAddr' \tcan activate this status \t\t\texpectEvent  : Publish event 'WorkflowStatusChange'", async () => {
                const findEvent = await votingInstance.startProposalsRegistering({from:ownerAddr});
                expectEvent(findEvent, "WorkflowStatusChange", {previousStatus: new BN(Voting.WorkflowStatus.RegisteringVoters)}, {newStatus: new BN(Voting.WorkflowStatus.ProposalsRegistrationStarted)});
            });
            it("b18   set 'ProposalsRegistrationStarted' \t✖ 'voter1Addr' \tcan't activate this status \t\t\texpectRevert : [onlyOwner]", async () => {
                await expectRevert(votingInstance.startProposalsRegistering({from:voter1Addr}), "caller is not the owner.");
            });

            //---[ ProposalsRegistrationEnded ]---
            it("b19   set 'ProposalsRegistrationEnded' \t✖ 'ownerAddr' \tcan't activate this status \t\t\texpectRevert : Registering proposals havent started yet", async () => {
                await expectRevert(votingInstance.endProposalsRegistering({from:ownerAddr}),"Registering proposals havent started yet");
            });
            it("b20   set 'ProposalsRegistrationEnded' \t✖ 'voter1Addr' \tcan't activate this status \t\t\texpectRevert : [onlyOwner]", async () => {
                await expectRevert(votingInstance.endProposalsRegistering({from:voter1Addr}), "caller is not the owner.");
            });

            //---[ VotingSessionStarted ]---
            it("b21   set 'VotingSessionStarted' \t\t✖ 'ownerAddr' \tcan't activate this status \t\t\texpectRevert : Registering proposals phase is not finished", async () => {
                await expectRevert(votingInstance.startVotingSession({from:ownerAddr}), "Registering proposals phase is not finished");
            });
            it("b22   set 'VotingSessionStarted' \t\t✖ 'voter1Addr' \tcan't activate this status \t\t\texpectRevert : [OnlyOwner]", async () => {
                await expectRevert(votingInstance.startVotingSession({from:voter1Addr}), "caller is not the owner.");
            });

            //---[ VotingSessionEnded ]---
            it("b23   set 'VotingSessionEnded' \t\t✖ 'ownerAddr' \tcan't activate this status  \t\t\texpectRevert : Voting session havent started yet", async () => {
                await expectRevert(votingInstance.endVotingSession({from:ownerAddr}), "Voting session havent started yet");
            });
            it("b24   set 'VotingSessionEnded' \t\t✖ 'voter1Addr \tcan't activate this status \t\t\texpectRevert : [onlyOwner]", async () => {
                await expectRevert(votingInstance.endVotingSession({from:voter1Addr}), "caller is not the owner.");
            });

            //---[ VotesTallied ]---
            it("b25   set 'VotesTallied' \t\t\t✖ 'ownerAddr' \tcan't activate this status \t\t\texpectRevert : Current status is not voting session ended", async () => {
                await expectRevert(votingInstance.tallyVotes({from:ownerAddr}), "Current status is not voting session ended");
            });
            it("b26   set 'VotesTallied' \t\t\t✖ 'voter1Addr' \tcan't activate this status \t\t\texpectRevert : [onlyOwner]", async () => {
                await expectRevert(votingInstance.tallyVotes({from:voter1Addr}), "caller is not the owner.");
            });

        });


        //===========================
        context("C] Testing all fonctions when status [ProposalsRegistrationStarted] is active, with all accounts ownerAddr, voter1Addr...", function () {

            beforeEach(async function () {
                // new instance
                votingInstance = await Voting.new({from:ownerAddr});
                // pre-load data
                await votingInstance.addVoter(voter1Addr, {from:ownerAddr});
                await votingInstance.addVoter(voter2Addr, {from:ownerAddr});
                await votingInstance.addVoter(voter3Addr, {from:ownerAddr});
                // active startProposalsRegistering
                await votingInstance.startProposalsRegistering({from:ownerAddr});
            });

            it("Confirm [ProposalsRegistrationStarted] is actual workflowStatus (expect)", async () => {
                const storedData = await votingInstance.workflowStatus.call({from:ownerAddr});
                expect(new BN(storedData)).to.be.bignumber.equal(new BN(1));
            });

            //---[ Test addVoter() ]---
            it("c01   use addVoter() \t\t\t\t✖ 'ownerAddr' \tcan't add voter 'voter1Addr' \t\t\texpectRevert : Voters registration is not open yet", async () => {
                await expectRevert(votingInstance.addVoter(voter1Addr, {from:ownerAddr}), "Voters registration is not open yet");
            });
            it("c02   use addVoter() \t\t\t\t✖ 'voter1Addr' \tcan't add voter 'voter2Addr' \t\t\texpectRevert : [onlyOwner]", async () => {
                await expectRevert(votingInstance.addVoter(voter2Addr, {from:voter1Addr}), "caller is not the owner.");
            });

            //---[ Test addProposal() ]---
            it("c03   use addProposal() \t\t\t✖ 'ownerAddr' \tcan't add proposal \t\t\t\texpectRevert : [onlyVoters]", async () => {
                await expectRevert(votingInstance.addProposal("my proposal", {from:ownerAddr}), "You're not a voter.");
            });
            it("c04   use addProposal() \t\t\t✔ 'voter1Addr' \tcan add 'Proposal_1 by voter1Addr' \t\texpect", async () => {
                await votingInstance.addProposal("Proposal_1 by voter1Addr", {from:voter1Addr});
                const storedData = await votingInstance.getOneProposal(0, {from:voter1Addr});
                expect(storedData['description']).to.equal("Proposal_1 by voter1Addr");
            });
            it("c05   use addProposal() \t\t\t✔ 'voter1Addr' \tcan re-add 'Proposal_2 by voter1Addr' \t\texpect", async () => {
                await votingInstance.addProposal("Proposal_2 by voter1Addr", {from:voter1Addr});
                const storedData = await votingInstance.getOneProposal(0, {from:voter1Addr});
                expect(storedData['description']).to.equal("Proposal_2 by voter1Addr");
            });
            it("c06   use addProposal() \t\t\t✖ 'ownerAddr' \tcan't add empty proposal \t\t\texpectRevert : [onlyVoters]", async () => {
                await expectRevert(votingInstance.addProposal("", {from:ownerAddr}), "You're not a voter.");
            });
            it("c07   use addProposal() \t\t\t✖ 'voter1Addr' \tcan't add empty proposal \t\t\texpectRevert : Vous ne pouvez pas ne rien proposer", async () => {
                await expectRevert(votingInstance.addProposal("", {from:voter1Addr}), "Vous ne pouvez pas ne rien proposer");
            });
            it("c08   use addProposal() \t\t\t✔ 'voter2Addr' \tcan add and publish event \t\t\texpectEvent  : Publish event 'ProposalRegistered'", async () => {
                const findEvent = await votingInstance.addProposal("Proposal_3 by voter2Addr", {from:voter1Addr});
                expectEvent(findEvent, "ProposalRegistered", {proposalId: new BN(0)});
            });

            //---[ Test setVote() ]---
            it("c09   use setVote() \t\t\t\t✖ 'ownerAddr' \tcan't set vote \t\t\t\t\texpectRevert : [onlyVoters]", async () => {
                await expectRevert(votingInstance.setVote(0, {from:ownerAddr}), "You're not a voter.");
            });
            it("c10   use setVote() \t\t\t\t✖ 'voter1Addr' \tcan't set vote \t\t\t\t\texpectRevert : Voting session havent started yet", async () => {
                await expectRevert(votingInstance.setVote(0, {from:voter1Addr}), "Voting session havent started yet");
            });

            //---[ Test tallyVotes() ]---
            it("c11   use tallyVotes() \t\t\t✖ 'ownerAddr' \tcan't tailly vote \t\t\t\texpectRevert : Current status is not voting session ended", async () => {
                await expectRevert(votingInstance.tallyVotes({from:ownerAddr}), "Current status is not voting session ended");
            });
            it("c12   use tallyVotes() \t\t\t✖ 'voter1Addr' \tcan't tailly vote \t\t\t\texpectRevert : [onlyOwner]", async () => {
                await expectRevert(votingInstance.tallyVotes({from:voter1Addr}), "caller is not the owner.");
            });

            //---[ Test getVoter() ]---
            it("c13   use getVoter() \t\t\t\t✖ 'ownerAddr' \tcan't get voter 'voter1Addr' \t\t\texpectRevert : [onlyVoters]", async () => {
                await expectRevert(votingInstance.getVoter(voter1Addr, {from:ownerAddr}), "You're not a voter");
            });
            it("c14   use getVoter() \t\t\t\t✔ 'voter1Addr' \tcan get voter 'voter2Addr' \t\t\texpect", async () => {
                const storedData = await votingInstance.getVoter(voter2Addr, {from:voter1Addr});
                expect(storedData.isRegistered).to.equal(true);
            });

            //---[ Test getOneProposal() ]---
            it("c15   use getOneProposal() \t\t\t✖ 'ownerAddr' \tcan't get proposal '0' \t\t\t\texpectRevert : [onlyVoters]", async () => {
                await expectRevert(votingInstance.getOneProposal(0, {from:ownerAddr}), "You're not a voter");
            });
            it("c16   use getOneProposal() \t\t\t✔ 'voter1Addr' \tcan get proposal '0' \t\t\t\texpect", async () => {
                await votingInstance.addProposal("Proposal_1 by voter1Addr", {from:voter1Addr});
                const storedData = await votingInstance.getOneProposal(0, {from:voter1Addr});
                expect(storedData['description']).to.equal("Proposal_1 by voter1Addr");
            });
            it("c17   use getOneProposal() \t\t\t✖ 'voter1Addr' \tcan't get inexistant proposal \t\t\texpectRevert : unspecified", async () => {
                await expectRevert.unspecified(votingInstance.getOneProposal(10, {from:voter1Addr}));
            });

            //---[ ProposalsRegistrationStarted ]---
            it("c18   set 'ProposalsRegistrationStarted' \t✖ 'ownerAddr' \tcan't activate this status \t\t\texpectRevert : Registering proposals cant be started now", async () => {
                await expectRevert(votingInstance.startProposalsRegistering({from:ownerAddr}),"Registering proposals cant be started now");
            });
            it("c19   set 'ProposalsRegistrationStarted' \t✖ 'voter1Addr' \tcan't activate this status \t\t\texpectRevert : [onlyOwner]", async () => {
                await expectRevert(votingInstance.startProposalsRegistering({from:voter1Addr}), "caller is not the owner.");
            });

            //---[ ProposalsRegistrationEnded ]---
            it("c20   set 'ProposalsRegistrationEnded' \t✔ 'ownerAddr' \tcan activate this status \t\t\texpectEvent  : Publish event 'WorkflowStatusChange'", async () => {
                const findEvent = await votingInstance.endProposalsRegistering({from:ownerAddr});
                expectEvent(findEvent, "WorkflowStatusChange", {previousStatus: new BN(Voting.WorkflowStatus.ProposalsRegistrationStarted)}, {newStatus: new BN(Voting.WorkflowStatus.ProposalsRegistrationEnded)});
            });
            it("c21   set 'ProposalsRegistrationEnded' \t✖ 'voter1Addr' \tcan't activate this status \t\t\texpectRevert : [onlyOwner]", async () => {
                await expectRevert(votingInstance.endProposalsRegistering({from:voter1Addr}), "caller is not the owner.");
            });

            //---[ VotingSessionStarted ]---
            it("c22   set 'VotingSessionStarted' \t\t✖ 'ownerAddr' \tcan't activate this status \t\t\texpectRevert : Registering proposals phase is not finished", async () => {
                await expectRevert(votingInstance.startVotingSession({from:ownerAddr}), "Registering proposals phase is not finished");
            });
            it("c23   set 'VotingSessionStarted' \t\t✖ 'voter1Addr' \tcan't activate this status \t\t\texpectRevert : [OnlyOwner]", async () => {
                await expectRevert(votingInstance.startVotingSession({from:voter1Addr}), "caller is not the owner.");
            });

            //---[ VotingSessionEnded ]---
            it("c24   set 'VotingSessionEnded' \t\t✖ 'ownerAddr' \tcan't activate this status  \t\t\texpectRevert : Voting session havent started yet", async () => {
                await expectRevert(votingInstance.endVotingSession({from:ownerAddr}), "Voting session havent started yet");
            });
            it("c25   set 'VotingSessionEnded' \t\t✖ 'voter1Addr \tcan't activate this status \t\t\texpectRevert : [onlyOwner]", async () => {
                await expectRevert(votingInstance.endVotingSession({from:voter1Addr}), "caller is not the owner.");
            });

            //---[ VotesTallied ]---
            it("c26   set 'VotesTallied' \t\t\t✖ 'ownerAddr' \tcan't activate this status \t\t\texpectRevert : Current status is not voting session ended", async () => {
                await expectRevert(votingInstance.tallyVotes({from:ownerAddr}), "Current status is not voting session ended");
            });
            it("c27   set 'VotesTallied' \t\t\t✖ 'voter1Addr' \tcan't activate this status \t\t\texpectRevert : [onlyOwner]", async () => {
                await expectRevert(votingInstance.tallyVotes({from:voter1Addr}), "caller is not the owner.");
            });

        });


        //===========================
        context("D] Testing all fonctions when status [ProposalsRegistrationEnded] is active, with all accounts ownerAddr, voter1Addr...", function () {

            beforeEach(async function () {
                // new instance
                votingInstance = await Voting.new({from:ownerAddr});
                // pre-load 'voters'
                await votingInstance.addVoter(voter1Addr, {from:ownerAddr});
                await votingInstance.addVoter(voter2Addr, {from:ownerAddr});
                await votingInstance.addVoter(voter3Addr, {from:ownerAddr});
                // active startProposalsRegistering
                await votingInstance.startProposalsRegistering({from:ownerAddr});
                // pre-load 'proposals'
                await votingInstance.addProposal("Proposal_1 by voter1Addr", {from:voter1Addr});
                await votingInstance.addProposal("Proposal_2 by voter2Addr", {from:voter2Addr});
                await votingInstance.addProposal("Proposal_22 by voter2Addr", {from:voter2Addr});
                await votingInstance.addProposal("Proposal_3 by voter3Addr", {from:voter3Addr});
                await votingInstance.addProposal("Proposal_33 by voter3Addr", {from:voter3Addr});
                await votingInstance.addProposal("Proposal_333 by voter3Addr", {from:voter3Addr});
                // active endProposalsRegistering
                await votingInstance.endProposalsRegistering({from:ownerAddr});
            });

            it("Confirm [ProposalsRegistrationEnded] is actual workflowStatus (expect)", async () => {
                const storedData = await votingInstance.workflowStatus.call({from:ownerAddr});
                expect(new BN(storedData)).to.be.bignumber.equal(new BN(2));
            });

            //---[ Test addVoter() ]---
            it("d01   use addVoter() \t\t\t\t✖ 'ownerAddr' \tcan't add voter 'voter1Addr' \t\t\texpectRevert : Voters registration is not open yet", async () => {
                await expectRevert(votingInstance.addVoter(voter1Addr, {from:ownerAddr}), "Voters registration is not open yet");
            });
            it("d02   use addVoter() \t\t\t\t✖ 'voter1Addr' \tcan't add voter 'voter2Addr' \t\t\texpectRevert : [onlyOwner]", async () => {
                await expectRevert(votingInstance.addVoter(voter2Addr, {from:voter1Addr}), "caller is not the owner.");
            });

            //---[ Test addProposal() ]---
            it("d03   use addProposal() \t\t\t✖ 'ownerAddr' \tcan't add proposal \t\t\t\texpectRevert : [onlyVoters]", async () => {
                await expectRevert(votingInstance.addProposal("my proposal", {from:ownerAddr}), "You're not a voter.");
            });
            it("d04   use addProposal() \t\t\t✖ 'voter1Addr' \tcan't add proposal \t\t\t\texpectRevert : Proposals are not allowed yet.", async () => {
                await expectRevert(votingInstance.addProposal("my proposal", {from:voter1Addr}), "Proposals are not allowed yet.");
            });
            it("d05   use addProposal() \t\t\t✖ 'ownerAddr' \tcan't add empty proposal \t\t\texpectRevert : [onlyVoters]", async () => {
                await expectRevert(votingInstance.addProposal("", {from:ownerAddr}), "You're not a voter.");
            });
            it("d06   use addProposal() \t\t\t✖ 'voter1Addr' \tcan't add empty proposal \t\t\texpectRevert : Proposals are not allowed yet.", async () => {
                await expectRevert(votingInstance.addProposal("", {from:voter1Addr}), "Proposals are not allowed yet.");
            });

            //---[ Test setVote() ]---
            it("d07   use setVote() \t\t\t\t✖ 'ownerAddr' \tcan't set vote \t\t\t\t\texpectRevert : [onlyVoters]", async () => {
                await expectRevert(votingInstance.setVote(0, {from:ownerAddr}), "You're not a voter.");
            });
            it("d08   use setVote() \t\t\t\t✖ 'voter1Addr' \tcan't set vote \t\t\t\t\texpectRevert : Voting session havent started yet", async () => {
                await expectRevert(votingInstance.setVote(0, {from:voter1Addr}), "Voting session havent started yet");
            });

            //---[ Test tallyVotes() ]---
            it("d09   use tallyVotes() \t\t\t✖ 'ownerAddr' \tcan't tailly vote \t\t\t\texpectRevert : Current status is not voting session ended", async () => {
                await expectRevert(votingInstance.tallyVotes({from:ownerAddr}), "Current status is not voting session ended");
            });
            it("d10   use tallyVotes() \t\t\t✖ 'voter1Addr' \tcan't tailly vote \t\t\t\texpectRevert : [onlyOwner]", async () => {
                await expectRevert(votingInstance.tallyVotes({from:voter1Addr}), "caller is not the owner.");
            });

            //---[ Test getVoter() ]---
            it("d11   use getVoter() \t\t\t\t✖ 'ownerAddr' \tcan't get voter 'voter1Addr' \t\t\texpectRevert : [onlyVoters]", async () => {
                await expectRevert(votingInstance.getVoter(voter1Addr, {from:ownerAddr}), "You're not a voter");
            });
            it("d12   use getVoter() \t\t\t\t✔ 'voter1Addr' \tcan get voter 'voter2Addr' \t\t\texpect", async () => {
                const storedData = await votingInstance.getVoter(voter2Addr, {from:voter1Addr});
                expect(storedData.isRegistered).to.equal(true);
            });

            //---[ Test getOneProposal() ]---
            it("d13   use getOneProposal() \t\t\t✖ 'ownerAddr' \tcan't get proposal '0' \t\t\t\texpectRevert : [onlyVoters]", async () => {
                await expectRevert(votingInstance.getOneProposal(0, {from:ownerAddr}), "You're not a voter");
            });
            it("d14   use getOneProposal() \t\t\t✔ 'voter1Addr' \tcan get proposal '0' \t\t\t\texpect", async () => {
                const storedData = await votingInstance.getOneProposal(0, {from:voter1Addr});
                expect(storedData['description']).to.equal("Proposal_1 by voter1Addr");
            });
            it("d15   use getOneProposal() \t\t\t✖ 'voter1Addr' \tcan't get inexistant proposal \t\t\texpectRevert : unspecified", async () => {
                await expectRevert.unspecified(votingInstance.getOneProposal(10, {from:voter1Addr}));
            });

            //---[ ProposalsRegistrationStarted ]---
            it("d16   set 'ProposalsRegistrationStarted' \t✖ 'ownerAddr' \tcan't activate this status \t\t\texpectRevert : Registering proposals cant be started now", async () => {
                await expectRevert(votingInstance.startProposalsRegistering({from:ownerAddr}),"Registering proposals cant be started now");
            });
            it("d17   set 'ProposalsRegistrationStarted' \t✖ 'voter1Addr' \tcan't activate this status \t\t\texpectRevert : [onlyOwner]", async () => {
                await expectRevert(votingInstance.startProposalsRegistering({from:voter1Addr}), "caller is not the owner.");
            });

            //---[  ProposalsRegistrationEnded ]---
            it("d18   set 'ProposalsRegistrationEnded' \t✖ 'ownerAddr' \tcan't activate this status \t\t\texpectRevert : Registering proposals cant be started now.", async () => {
                await expectRevert(votingInstance.startProposalsRegistering({from:ownerAddr}), "Registering proposals cant be started now.");
            });
            it("d19   set 'ProposalsRegistrationEnded' \t✖ 'voter1Addr' \tcan't activate this status \t\t\texpectRevert : [onlyOwner]", async () => {
                await expectRevert(votingInstance.endProposalsRegistering({from:voter1Addr}), "caller is not the owner.");
            });

            //---[  VotingSessionStarted ]---
            it("d20   set 'VotingSessionStarted' \t\t✔ 'ownerAddr' \tcan activate this status \t\t\texpectEvent  : Publish event 'WorkflowStatusChange'", async () => {
                const findEvent = await votingInstance.startVotingSession({from:ownerAddr});
                expectEvent(findEvent, "WorkflowStatusChange", {previousStatus: new BN(Voting.WorkflowStatus.ProposalsRegistrationEnded)}, {newStatus: new BN(Voting.WorkflowStatus.VotingSessionStarted)});
            });
            it("d21   set 'VotingSessionStarted' \t\t✖ 'voter1Addr' \tcan't activate this status \t\t\texpectRevert : [OnlyOwner]", async () => {
                await expectRevert(votingInstance.startVotingSession({from:voter1Addr}), "caller is not the owner.");
            });

            //---[  VotingSessionEnded ]---
            it("d22   set 'VotingSessionEnded' \t\t✖ 'ownerAddr' \tcan't activate this status  \t\t\texpectRevert : Voting session havent started yet", async () => {
                await expectRevert(votingInstance.endVotingSession({from:ownerAddr}), "Voting session havent started yet");
            });
            it("d23   set 'VotingSessionEnded' \t\t✖ 'voter1Addr \tcan't activate this status \t\t\texpectRevert : [onlyOwner]", async () => {
                await expectRevert(votingInstance.endVotingSession({from:voter1Addr}), "caller is not the owner.");
            });

            //---[  VotesTallied ]---
            it("d24   set 'VotesTallied' \t\t\t✖ 'ownerAddr' \tcan't activate this status \t\t\texpectRevert : Current status is not voting session ended", async () => {
                await expectRevert(votingInstance.tallyVotes({from:ownerAddr}), "Current status is not voting session ended");
            });
            it("d25   set 'VotesTallied' \t\t\t✖ 'voter1Addr' \tcan't activate this status \t\t\texpectRevert : [onlyOwner]", async () => {
                await expectRevert(votingInstance.tallyVotes({from:voter1Addr}), "caller is not the owner.");
            });

        });


        //===========================
        context("E] Testing all fonctions when status [VotingSessionStarted] is active, with all accounts ownerAddr, voter1Addr...", function () {

            beforeEach(async function () {
                // new instance
                votingInstance = await Voting.new({from:ownerAddr});
                // pre-load 'voters'
                await votingInstance.addVoter(voter1Addr, {from:ownerAddr});
                await votingInstance.addVoter(voter2Addr, {from:ownerAddr});
                await votingInstance.addVoter(voter3Addr, {from:ownerAddr});
                // active ProposalsRegistrationStarted
                await votingInstance.startProposalsRegistering({from:ownerAddr});
                // pre-load 'proposals'
                await votingInstance.addProposal("Proposal_1 by voter1Addr", {from:voter1Addr});
                await votingInstance.addProposal("Proposal_2 by voter2Addr", {from:voter2Addr});
                await votingInstance.addProposal("Proposal_22 by voter2Addr", {from:voter2Addr});
                await votingInstance.addProposal("Proposal_3 by voter3Addr", {from:voter3Addr});
                await votingInstance.addProposal("Proposal_33 by voter3Addr", {from:voter3Addr});
                await votingInstance.addProposal("Proposal_333 by voter3Addr", {from:voter3Addr});
                // active ProposalsRegistrationEnded
                await votingInstance.endProposalsRegistering({from:ownerAddr});
                // active VotingSessionStarted
                await votingInstance.startVotingSession({from:ownerAddr});
            });

            it("Confirm [VotingSessionStarted] is actual workflowStatus (expect)", async () => {
                const storedData = await votingInstance.workflowStatus.call({from:ownerAddr});
                expect(new BN(storedData)).to.be.bignumber.equal(new BN(3));
            });

            //---[ Test addVoter() ]---
            it("e01   use addVoter() \t\t\t\t✖ 'ownerAddr' \tcan't add voter 'voter1Addr' \t\t\texpectRevert : Voters registration is not open yet", async () => {
                await expectRevert(votingInstance.addVoter(voter1Addr, {from:ownerAddr}), "Voters registration is not open yet");
            });
            it("e02   use addVoter() \t\t\t\t✖ 'voter1Addr' \tcan't add voter 'voter2Addr' \t\t\texpectRevert : [onlyOwner]", async () => {
                await expectRevert(votingInstance.addVoter(voter2Addr, {from:voter1Addr}), "caller is not the owner.");
            });

            //---[ Test addProposal() ]---
            it("e03   use addProposal() \t\t\t✖ 'ownerAddr' \tcan't add proposal \t\t\t\texpectRevert : [onlyVoters]", async () => {
                await expectRevert(votingInstance.addProposal("my proposal", {from:ownerAddr}), "You're not a voter.");
            });
            it("e04   use addProposal() \t\t\t✖ 'voter1Addr' \tcan't add proposal \t\t\t\texpectRevert : Proposals are not allowed yet.", async () => {
                await expectRevert(votingInstance.addProposal("my proposal", {from:voter1Addr}), "Proposals are not allowed yet.");
            });
            it("e05   use addProposal() \t\t\t✖ 'ownerAddr' \tcan't add empty proposal \t\t\texpectRevert : [onlyVoters]", async () => {
                await expectRevert(votingInstance.addProposal("", {from:ownerAddr}), "You're not a voter.");
            });
            it("e06   use addProposal() \t\t\t✖ 'voter1Addr' \tcan't add empty proposal \t\t\texpectRevert : Proposals are not allowed yet.", async () => {
                await expectRevert(votingInstance.addProposal("", {from:voter1Addr}), "Proposals are not allowed yet.");
            });

            //---[ Test setVote() ]---
            it("e07   use setVote() \t\t\t\t✖ 'ownerAddr' \tcan't set vote \t\t\t\t\texpectRevert : [onlyVoters]", async () => {
                await expectRevert(votingInstance.setVote(0, {from:ownerAddr}), "You're not a voter.");
            });
            it("e08   use setVote() \t\t\t\t✔ 'voter1Addr' \tcan vote 'Proposal_1 by voter1Addr' \t\texpect", async () => {
                await votingInstance.setVote(0, {from:voter1Addr});
                const storedData = await votingInstance.getVoter(voter1Addr, {from:voter1Addr});
                expect(storedData.hasVoted).to.be.true;
            });
            it("e09   use setVote() \t\t\t\t✖ 'voter1Addr' \tcan't re-vote \t\t\t\t\texpectRevert : You have already voted", async () => {
                await votingInstance.setVote(0, {from:voter1Addr});
                await expectRevert(votingInstance.setVote(1, {from:voter1Addr}), "You have already voted");
            });
            it("e10   use setVote() \t\t\t\t✔ 'voter2Addr' \tcan publish event 'Voted' \t\t\texpectEvent  : Publish event 'Voted'", async () => {
                const findEvent = await votingInstance.setVote(1, {from:voter2Addr});
                expectEvent(findEvent, "Voted", {voter: voter2Addr, proposalId: new BN(1)});
            });
            it("e11   use setVote() \t\t\t\t✖ 'voter3Addr' \tcan't vote a non-existent proposal \t\t\expectRevert : Proposal not found", async () => {
                await expectRevert(votingInstance.setVote(10, {from:voter3Addr}), "Proposal not found");
            });
                
            //---[ Test tallyVotes() ]---
            it("e12   use tallyVotes() \t\t\t✖ 'ownerAddr' \tcan't tailly vote \t\t\t\texpectRevert : Current status is not voting session ended", async () => {
                await expectRevert(votingInstance.tallyVotes({from:ownerAddr}), "Current status is not voting session ended");
            });
            it("e13   use tallyVotes() \t\t\t✖ 'voter1Addr' \tcan't tailly vote \t\t\t\texpectRevert : [onlyOwner]", async () => {
                await expectRevert(votingInstance.tallyVotes({from:voter1Addr}), "caller is not the owner.");
            });

            //---[ Test getVoter() ]---
            it("e14   use getVoter() \t\t\t\t✖ 'ownerAddr' \tcan't get voter 'voter1Addr' \t\t\texpectRevert : [onlyVoters]", async () => {
                await expectRevert(votingInstance.getVoter(voter1Addr, {from:ownerAddr}), "You're not a voter");
            });
            it("e15   use getVoter() \t\t\t\t✔ 'voter1Addr' \tcan get voter 'voter2Addr' \t\t\texpect", async () => {
                const storedData = await votingInstance.getVoter(voter2Addr, {from:voter1Addr});
                expect(storedData.isRegistered).to.equal(true);
            });

            //---[ Test getOneProposal() ]---
            it("e16   use getOneProposal() \t\t\t✖ 'ownerAddr' \tcan't get proposal '0' \t\t\t\texpectRevert : [onlyVoters]", async () => {
                await expectRevert(votingInstance.getOneProposal(0, {from:ownerAddr}), "You're not a voter");
            });
            it("e17   use getOneProposal() \t\t\t✔ 'voter1Addr' \tcan get proposal '0' \t\t\t\texpect", async () => {
                const storedData = await votingInstance.getOneProposal(0, {from:voter1Addr});
                expect(storedData['description']).to.equal("Proposal_1 by voter1Addr");
            });
            it("e18   use getOneProposal() \t\t\t✖ 'voter1Addr' \tcan't get inexistant proposal \t\t\texpectRevert : unspecified", async () => {
                await expectRevert.unspecified(votingInstance.getOneProposal(10, {from:voter1Addr}));
            });

            //---[ ProposalsRegistrationStarted ]---
            it("e19   set 'ProposalsRegistrationStarted' \t✖ 'ownerAddr' \tcan't activate this status \t\t\texpectEvent  : Registering proposals cant be started now", async () => {
                await expectRevert(votingInstance.startProposalsRegistering({from:ownerAddr}),"Registering proposals cant be started now");
            });
            it("e20   set 'ProposalsRegistrationStarted' \t✖ 'voter1Addr' \tcan't activate this status \t\t\texpectRevert : [onlyOwner]", async () => {
                await expectRevert(votingInstance.startProposalsRegistering({from:voter1Addr}), "caller is not the owner.");
            });

            //---[ ProposalsRegistrationEnded ]---
            it("e21   set 'ProposalsRegistrationEnded' \t✖ 'ownerAddr' \tcan't activate this status \t\t\texpectEvent  : Registering proposals cant be started now.", async () => {
                await expectRevert(votingInstance.startProposalsRegistering({from:ownerAddr}), "Registering proposals cant be started now.");
            });
            it("e22   set 'ProposalsRegistrationEnded' \t✖ 'voter1Addr' \tcan't activate this status \t\t\texpectEvent  : [onlyOwner]", async () => {
                await expectRevert(votingInstance.endProposalsRegistering({from:voter1Addr}), "caller is not the owner.");
            });

            //---[ VotingSessionStarted ]---
            it("e23   set 'VotingSessionStarted' \t\t✖ 'ownerAddr' \tcan't activate this status \t\t\texpectEvent  : Registering proposals phase is not finished.", async () => {
                await expectRevert(votingInstance.startVotingSession({from:ownerAddr}), "Registering proposals phase is not finished.");
            });
            it("e24   set 'VotingSessionStarted' \t\t✖ 'voter1Addr' \tcan't activate this status \t\t\texpectRevert : [OnlyOwner]", async () => {
                await expectRevert(votingInstance.startVotingSession({from:voter1Addr}), "caller is not the owner.");
            });

            //---[ VotingSessionEnded ]---
            it("e25   set 'VotingSessionEnded' \t\t✔ 'ownerAddr' \tcan activate this status  \t\t\texpectEvent  : Publish event 'WorkflowStatusChange'", async () => {
                const findEvent = await votingInstance.endVotingSession({from:ownerAddr});
                expectEvent(findEvent, "WorkflowStatusChange", {previousStatus: new BN(Voting.WorkflowStatus.VotingSessionStarted)}, {newStatus: new BN(Voting.WorkflowStatus.VotingSessionEnded)});
            });
            it("e26   set 'VotingSessionEnded' \t\t✖ 'voter1Addr \tcan't activate this status \t\t\texpectRevert : [onlyOwner]", async () => {
                await expectRevert(votingInstance.endVotingSession({from:voter1Addr}), "caller is not the owner.");
            });

            //---[ VotesTallied ]---
            it("e27   set 'VotesTallied' \t\t\t✖ 'ownerAddr' \tcan't activate this status \t\t\texpectRevert : Current status is not voting session ended", async () => {
                await expectRevert(votingInstance.tallyVotes({from:ownerAddr}), "Current status is not voting session ended");
            });
            it("e28   set 'VotesTallied' \t\t\t✖ 'voter1Addr' \tcan't activate this status \t\t\texpectRevert : [onlyOwner]", async () => {
                await expectRevert(votingInstance.tallyVotes({from:voter1Addr}), "caller is not the owner.");
            });

        });


        //===========================
        context("F] Testing all fonctions when status [VotingSessionEnded] is active, with all accounts ownerAddr, voter1Addr...", function () {

            beforeEach(async function () {
                // new instance
                votingInstance = await Voting.new({from:ownerAddr});
                // pre-load 'voters'
                await votingInstance.addVoter(voter1Addr, {from:ownerAddr});
                await votingInstance.addVoter(voter2Addr, {from:ownerAddr});
                await votingInstance.addVoter(voter3Addr, {from:ownerAddr});
                // active ProposalsRegistrationStarted
                await votingInstance.startProposalsRegistering({from:ownerAddr});
                // pre-load 'proposals'
                await votingInstance.addProposal("Proposal_1 by voter1Addr", {from:voter1Addr});
                await votingInstance.addProposal("Proposal_2 by voter2Addr", {from:voter2Addr});
                await votingInstance.addProposal("Proposal_22 by voter2Addr", {from:voter2Addr});
                await votingInstance.addProposal("Proposal_3 by voter3Addr", {from:voter3Addr});
                await votingInstance.addProposal("Proposal_33 by voter3Addr", {from:voter3Addr});
                await votingInstance.addProposal("Proposal_333 by voter3Addr", {from:voter3Addr});
                // active ProposalsRegistrationEnded
                await votingInstance.endProposalsRegistering({from:ownerAddr});
                // active VotingSessionStarted
                await votingInstance.startVotingSession({from:ownerAddr});
                // pre-load 'votes'
                await votingInstance.setVote(0, {from:voter1Addr});
                await votingInstance.setVote(1, {from:voter2Addr});
                await votingInstance.setVote(1, {from:voter3Addr});
                // active VotingSessionEnded
                await votingInstance.endVotingSession({from:ownerAddr});
            });

            it("Confirm [VotingSessionEnded] is actual workflowStatus (expect)", async () => {
                const storedData = await votingInstance.workflowStatus.call({from:ownerAddr});
                expect(new BN(storedData)).to.be.bignumber.equal(new BN(4));
            });

            //---[ Test addVoter() ]---
            it("f01   use addVoter() \t\t\t\t✖ 'ownerAddr' \tcan't add voter 'voter1Addr' \t\t\texpectRevert : Voters registration is not open yet", async () => {
                await expectRevert(votingInstance.addVoter(voter1Addr, {from:ownerAddr}), "Voters registration is not open yet");
            });
            it("f02   use addVoter() \t\t\t\t✖ 'voter1Addr' \tcan't add voter 'voter2Addr' \t\t\texpectRevert : [onlyOwner]", async () => {
                await expectRevert(votingInstance.addVoter(voter2Addr, {from:voter1Addr}), "caller is not the owner.");
            });

            //---[ Test addProposal() ]---
            it("f03   use addProposal() \t\t\t✖ 'ownerAddr' \tcan't add proposal \t\t\t\texpectRevert : [onlyVoters]", async () => {
                await expectRevert(votingInstance.addProposal("my proposal", {from:ownerAddr}), "You're not a voter.");
            });
            it("f04   use addProposal() \t\t\t✖ 'voter1Addr' \tcan't add proposal \t\t\t\texpectRevert : Proposals are not allowed yet.", async () => {
                await expectRevert(votingInstance.addProposal("my proposal", {from:voter1Addr}), "Proposals are not allowed yet.");
            });
            it("f05   use addProposal() \t\t\t✖ 'ownerAddr' \tcan't add empty proposal \t\t\texpectRevert : [onlyVoters]", async () => {
                await expectRevert(votingInstance.addProposal("", {from:ownerAddr}), "You're not a voter.");
            });
            it("f06   use addProposal() \t\t\t✖ 'voter1Addr' \tcan't add empty proposal \t\t\texpectRevert : Proposals are not allowed yet.", async () => {
                await expectRevert(votingInstance.addProposal("", {from:voter1Addr}), "Proposals are not allowed yet.");
            });

            //---[ Test setVote() ]---
            it("f07   use setVote() \t\t\t\t✖ 'ownerAddr' \tcan't set vote \t\t\t\t\texpectRevert : [onlyVoters]", async () => {
                await expectRevert(votingInstance.setVote(0, {from:ownerAddr}), "You're not a voter.");
            });
            it("f08   use setVote() \t\t\t\t✖ 'voter1Addr' \tcan't vote \t\t\t\t\texpectRevert : Voting session havent started yet.", async () => {
                await expectRevert(votingInstance.setVote(0, {from:voter1Addr}), "Voting session havent started yet.");
            });
            it("f09   use setVote() \t\t\t\t✖ 'voter3Addr' \tcan't vote a non-existent proposal \t\t\expectRevert : Voting session havent started yet.", async () => {
                await expectRevert(votingInstance.setVote(10, {from:voter3Addr}), "Voting session havent started yet.");
            });

            //---[ Test tallyVotes() ]---
            it("f10   use tallyVotes() \t\t\t✔ 'ownerAddr' \tcan tailly vote \t\t\t\texpectEvent  : Publish event 'WorkflowStatusChange", async () => {
                const findEvent = await votingInstance.tallyVotes({from:ownerAddr});
                expectEvent(findEvent, "WorkflowStatusChange", {previousStatus: new BN(Voting.WorkflowStatus.VotingSessionEnded)}, {newStatus: new BN(Voting.WorkflowStatus.VotesTallied)});
            });
            it("f11   use tallyVotes() \t\t\t✖ 'voter1Addr' \tcan't tailly vote \t\t\t\texpectRevert : [onlyOwner]", async () => {
                await expectRevert(votingInstance.tallyVotes({from:voter1Addr}), "caller is not the owner.");
            });

            //---[ Test getVoter() ]---
            it("f12   use getVoter() \t\t\t\t✖ 'ownerAddr' \tcan't get voter 'voter1Addr' \t\t\texpectRevert : [onlyVoters]", async () => {
                await expectRevert(votingInstance.getVoter(voter1Addr, {from:ownerAddr}), "You're not a voter");
            });
            it("f13   use getVoter() \t\t\t\t✔ 'voter1Addr' \tcan get voter 'voter2Addr' \t\t\texpect", async () => {
                const storedData = await votingInstance.getVoter(voter2Addr, {from:voter1Addr});
                expect(storedData.isRegistered).to.equal(true);
            });

            //---[ Test getOneProposal() ]---
            it("f14   use getOneProposal() \t\t\t✖ 'ownerAddr' \tcan't get proposal '0' \t\t\t\texpectRevert : [onlyVoters]", async () => {
                await expectRevert(votingInstance.getOneProposal(0, {from:ownerAddr}), "You're not a voter");
            });
            it("f15   use getOneProposal() \t\t\t✔ 'voter1Addr' \tcan get proposal '0' \t\t\t\texpect", async () => {
                const storedData = await votingInstance.getOneProposal(0, {from:voter1Addr});
                expect(storedData['description']).to.equal("Proposal_1 by voter1Addr");
            });
            it("f16   use getOneProposal() \t\t\t✖ 'voter1Addr' \tcan't get inexistant proposal \t\t\texpectRevert : unspecified", async () => {
                await expectRevert.unspecified(votingInstance.getOneProposal(10, {from:voter1Addr}));
            });

            //---[ ProposalsRegistrationStarted ]---
            it("f17   set 'ProposalsRegistrationStarted' \t✖ 'ownerAddr' \tcan't activate this status \t\t\texpectRevert : Registering proposals cant be started now", async () => {
                await expectRevert(votingInstance.startProposalsRegistering({from:ownerAddr}),"Registering proposals cant be started now");
            });
            it("f18   set 'ProposalsRegistrationStarted' \t✖ 'voter1Addr' \tcan't activate this status \t\t\texpectRevert : [onlyOwner]", async () => {
                await expectRevert(votingInstance.startProposalsRegistering({from:voter1Addr}), "caller is not the owner.");
            });

            //---[ ProposalsRegistrationEnded ]---
            it("f19   set 'ProposalsRegistrationEnded' \t✖ 'ownerAddr' \tcan't activate this status \t\t\texpectRevert : Registering proposals cant be started now.", async () => {
                await expectRevert(votingInstance.startProposalsRegistering({from:ownerAddr}), "Registering proposals cant be started now.");
            });
            it("f20   set 'ProposalsRegistrationEnded' \t✖ 'voter1Addr' \tcan't activate this status \t\t\texpectRevert : [onlyOwner]", async () => {
                await expectRevert(votingInstance.endProposalsRegistering({from:voter1Addr}), "caller is not the owner.");
            });

            //---[ VotingSessionStarted ]---
            it("f21   set 'VotingSessionStarted' \t\t✖ 'ownerAddr' \tcan't activate this status \t\t\texpectRevert : Registering proposals phase is not finished.", async () => {
                await expectRevert(votingInstance.startVotingSession({from:ownerAddr}), "Registering proposals phase is not finished.");
            });
            it("f22   set 'VotingSessionStarted' \t\t✖ 'voter1Addr' \tcan't activate this status \t\t\texpectRevert : [OnlyOwner]", async () => {
                await expectRevert(votingInstance.startVotingSession({from:voter1Addr}), "caller is not the owner.");
            });

            //---[ VotingSessionEnded ]---
            it("f23   set 'VotingSessionEnded' \t\t✖ 'ownerAddr' \tcan't activate this status  \t\t\texpectRevert : Voting session havent started yet", async () => {
                await expectRevert(votingInstance.endVotingSession({from:ownerAddr}), "Voting session havent started yet");
            });
            it("f24   set 'VotingSessionEnded' \t\t✖ 'voter1Addr \tcan't activate this status \t\t\texpectRevert : [onlyOwner]", async () => {
                await expectRevert(votingInstance.endVotingSession({from:voter1Addr}), "caller is not the owner.");
            });

            //---[ VotesTallied ]---
            it("f25   set 'VotesTallied' \t\t\t✔ 'ownerAddr' \tcan activate this status \t\t\texpectEvent  : Publish event 'WorkflowStatusChange'", async () => {
                const findEvent = await votingInstance.tallyVotes({from:ownerAddr});
                expectEvent(findEvent, "WorkflowStatusChange", {previousStatus: new BN(Voting.WorkflowStatus.VotingSessionEnded)}, {newStatus: new BN(Voting.WorkflowStatus.VotesTallied)});
            });
            it("f26   set 'VotesTallied' \t\t\t✖ 'voter1Addr' \tcan't activate this status \t\t\texpectRevert : [onlyOwner]", async () => {
                await expectRevert(votingInstance.tallyVotes({from:voter1Addr}), "caller is not the owner.");
            });

        });


        //===========================
        context("G] Testing all fonctions when status [VotesTallied] is active, with all accounts ownerAddr, voter1Addr...", function () {

            beforeEach(async function () {
                // new instance
                votingInstance = await Voting.new({from:ownerAddr});
                // pre-load 'voters'
                await votingInstance.addVoter(voter1Addr, {from:ownerAddr});
                await votingInstance.addVoter(voter2Addr, {from:ownerAddr});
                await votingInstance.addVoter(voter3Addr, {from:ownerAddr});
                // active ProposalsRegistrationStarted
                await votingInstance.startProposalsRegistering({from:ownerAddr});
                // pre-load 'proposals'
                await votingInstance.addProposal("Proposal_1 by voter1Addr", {from:voter1Addr});
                await votingInstance.addProposal("Proposal_2 by voter2Addr", {from:voter2Addr});
                await votingInstance.addProposal("Proposal_22 by voter2Addr", {from:voter2Addr});
                await votingInstance.addProposal("Proposal_3 by voter3Addr", {from:voter3Addr});
                await votingInstance.addProposal("Proposal_33 by voter3Addr", {from:voter3Addr});
                await votingInstance.addProposal("Proposal_333 by voter3Addr", {from:voter3Addr});
                // active ProposalsRegistrationEnded
                await votingInstance.endProposalsRegistering({from:ownerAddr});
                // active VotingSessionStarted
                await votingInstance.startVotingSession({from:ownerAddr});
                // pre-load 'votes'
                await votingInstance.setVote(0, {from:voter1Addr});
                await votingInstance.setVote(1, {from:voter2Addr});
                await votingInstance.setVote(0, {from:voter3Addr});
                // active VotingSessionEnded
                await votingInstance.endVotingSession({from:ownerAddr});
                // active VotingSessionEnded
                await votingInstance.tallyVotes({from:ownerAddr});
            });

            it("Confirm [VotesTallied] is actual workflowStatus (expect)", async () => {
                const storedData = await votingInstance.workflowStatus.call({from:ownerAddr});
                expect(new BN(storedData)).to.be.bignumber.equal(new BN(5));
            });

            //---[ Test addVoter() ]---
            it("g01   use addVoter() \t\t\t\t✖ 'ownerAddr' \tcan't add voter 'voter1Addr' \t\t\texpectRevert : Voters registration is not open yet", async () => {
                await expectRevert(votingInstance.addVoter(voter1Addr, {from:ownerAddr}), "Voters registration is not open yet");
            });
            it("g02   use addVoter() \t\t\t\t✖ 'voter1Addr' \tcan't add voter 'voter2Addr' \t\t\texpectRevert : [onlyOwner]", async () => {
                await expectRevert(votingInstance.addVoter(voter2Addr, {from:voter1Addr}), "caller is not the owner.");
            });

            //---[ Test addProposal() ]---
            it("g03   use addProposal() \t\t\t✖ 'ownerAddr' \tcan't add proposal \t\t\t\texpectRevert : [onlyVoters]", async () => {
                await expectRevert(votingInstance.addProposal("my proposal", {from:ownerAddr}), "You're not a voter.");
            });
            it("g04   use addProposal() \t\t\t✖ 'voter1Addr' \tcan't add proposal \t\t\t\texpectRevert : Proposals are not allowed yet.", async () => {
                await expectRevert(votingInstance.addProposal("my proposal", {from:voter1Addr}), "Proposals are not allowed yet.");
            });
            it("g05   use addProposal() \t\t\t✖ 'ownerAddr' \tcan't add empty proposal \t\t\texpectRevert : [onlyVoters]", async () => {
                await expectRevert(votingInstance.addProposal("", {from:ownerAddr}), "You're not a voter.");
            });
            it("g06   use addProposal() \t\t\t✖ 'voter1Addr' \tcan't add empty proposal \t\t\texpectRevert : Proposals are not allowed yet.", async () => {
                await expectRevert(votingInstance.addProposal("", {from:voter1Addr}), "Proposals are not allowed yet.");
            });

            //---[ Test setVote() ]---
            it("g07   use setVote() \t\t\t\t✖ 'ownerAddr' \tcan't set vote \t\t\t\t\texpectRevert : [onlyVoters]", async () => {
                await expectRevert(votingInstance.setVote(0, {from:ownerAddr}), "You're not a voter.");
            });
            it("g08   use setVote() \t\t\t\t✖ 'voter1Addr' \tcan't vote \t\t\t\t\texpectRevert : Voting session havent started yet.", async () => {
                await expectRevert(votingInstance.setVote(0, {from:voter1Addr}), "Voting session havent started yet.");
            });
            it("g09   use setVote() \t\t\t\t✖ 'voter3Addr' \tcan't vote a non-existent proposal \t\t\expectRevert : Voting session havent started yet.", async () => {
                await expectRevert(votingInstance.setVote(10, {from:voter3Addr}), "Voting session havent started yet.");
            });
                
            //---[ Test tallyVotes() ]---
            it("g10   use tallyVotes() \t\t\t✖ 'ownerAddr' \tcan't tailly vote \t\t\t\texpectRevert : Current status is not voting session ended.", async () => {
                await expectRevert(votingInstance.tallyVotes({from:ownerAddr}), "Current status is not voting session ended.");
            });
            it("g11   use tallyVotes() \t\t\t✖ 'voter1Addr' \tcan't tailly vote \t\t\t\texpectRevert : [onlyOwner]", async () => {
                await expectRevert(votingInstance.tallyVotes({from:voter1Addr}), "caller is not the owner.");
            });

            //---[ Test getVoter() ]---
            it("g12   use getVoter() \t\t\t\t✖ 'ownerAddr' \tcan't get voter 'voter1Addr' \t\t\texpectRevert : [onlyVoters]", async () => {
                await expectRevert(votingInstance.getVoter(voter1Addr, {from:ownerAddr}), "You're not a voter");
            });
            it("g13   use getVoter() \t\t\t\t✔ 'voter1Addr' \tcan get voter 'voter2Addr' \t\t\texpect", async () => {
                const storedData = await votingInstance.getVoter(voter2Addr, {from:voter1Addr});
                expect(storedData.isRegistered).to.equal(true);
            });

            //---[ Test getOneProposal() ]---
            it("g14   use getOneProposal() \t\t\t✖ 'ownerAddr' \tcan't get proposal '0' \t\t\t\texpectRevert : [onlyVoters]", async () => {
                await expectRevert(votingInstance.getOneProposal(0, {from:ownerAddr}), "You're not a voter");
            });
            it("g15   use getOneProposal() \t\t\t✔ 'voter1Addr' \tcan get proposal '0' \t\t\t\texpect", async () => {
                const storedData = await votingInstance.getOneProposal(0, {from:voter1Addr});
                expect(storedData['description']).to.equal("Proposal_1 by voter1Addr");
            });
            it("g16   use getOneProposal() \t\t\t✖ 'voter1Addr' \tcan't get inexistant proposal \t\t\texpectRevert : unspecified", async () => {
                await expectRevert.unspecified(votingInstance.getOneProposal(10, {from:voter1Addr}));
            });

            //---[ ProposalsRegistrationStarted ]---
            it("g17   set 'ProposalsRegistrationStarted' \t✖ 'ownerAddr' \tcan't activate this status \t\t\texpectRevert : Registering proposals cant be started now", async () => {
                await expectRevert(votingInstance.startProposalsRegistering({from:ownerAddr}),"Registering proposals cant be started now");
            });
            it("g18   set 'ProposalsRegistrationStarted' \t✖ 'voter1Addr' \tcan't activate this status \t\t\texpectRevert : [onlyOwner]", async () => {
                await expectRevert(votingInstance.startProposalsRegistering({from:voter1Addr}), "caller is not the owner.");
            });

            //---[ ProposalsRegistrationEnded ]---
            it("g19   set 'ProposalsRegistrationEnded' \t✖ 'ownerAddr' \tcan't activate this status \t\t\texpectRevert : Registering proposals cant be started now.", async () => {
                await expectRevert(votingInstance.startProposalsRegistering({from:ownerAddr}), "Registering proposals cant be started now.");
            });
            it("g20   set 'ProposalsRegistrationEnded' \t✖ 'voter1Addr' \tcan't activate this status \t\t\texpectRevert : [onlyOwner]", async () => {
                await expectRevert(votingInstance.endProposalsRegistering({from:voter1Addr}), "caller is not the owner.");
            });

            //---[ VotingSessionStarted ]---
            it("g21   set 'VotingSessionStarted' \t\t✖ 'ownerAddr' \tcan't activate this status \t\t\texpectRevert : Registering proposals phase is not finished.", async () => {
                await expectRevert(votingInstance.startVotingSession({from:ownerAddr}), "Registering proposals phase is not finished.");
            });
            it("g22   set 'VotingSessionStarted' \t\t✖ 'voter1Addr' \tcan't activate this status \t\t\texpectRevert : [OnlyOwner]", async () => {
                await expectRevert(votingInstance.startVotingSession({from:voter1Addr}), "caller is not the owner.");
            });

            //---[ VotingSessionEnded ]---
            it("g23   set 'VotingSessionEnded' \t\t✖ 'ownerAddr' \tcan't activate this status  \t\t\texpectRevert : Voting session havent started yet", async () => {
                await expectRevert(votingInstance.endVotingSession({from:ownerAddr}), "Voting session havent started yet");
            });
            it("g24   set 'VotingSessionEnded' \t\t✖ 'voter1Addr \tcan't activate this status \t\t\texpectRevert : [onlyOwner]", async () => {
                await expectRevert(votingInstance.endVotingSession({from:voter1Addr}), "caller is not the owner.");
            });

            //---[ VotesTallied ]---
            it("g25   set 'VotesTallied' \t\t\t✖ 'ownerAddr' \tcan't activate this status \t\t\texpectRevert : Current status is not voting session ended.", async () => {
                await expectRevert(votingInstance.tallyVotes({from:ownerAddr}), "Current status is not voting session ended.");
            });
            it("g26   set 'VotesTallied' \t\t\t✖ 'voter1Addr' \tcan't activate this status \t\t\texpectRevert : [onlyOwner]", async () => {
                await expectRevert(votingInstance.tallyVotes({from:voter1Addr}), "caller is not the owner.");
            });

        });


    });


});
  