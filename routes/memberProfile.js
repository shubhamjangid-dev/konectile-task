const express = require('express');
const { 
   getAllMemberList, 
   getSingleMemberProfile, 
   getLatestMemberProfile, 
   createMemberProfile, 
   createBulkMemberProfile,
   getMemberTransctionList,
   getTransactionsByMember,
   saveMultiTransaction,
   editMemberProfile,
   changeMemberStatus,
   addFamilyMember,
   getNextMemberId,
   getMemberTransactionListV2,
   getAllActiveMembers,
   } = require('../controller/member');
const { isAuth } = require('../middleware/userAuth');

const router = express.Router()

// create a memberProfile
router.post(
      '/create', 
      isAuth,
      createMemberProfile
);

router.post('/createBulkMembers',isAuth, createBulkMemberProfile)

router.put('/:MemberID',isAuth, editMemberProfile);

// Change member status
router.patch('/:MemberID/status',isAuth, changeMemberStatus);

// Add family member
router.post('/:MemberID/family',isAuth, addFamilyMember);

// get memberList
router.get(
    '/getAllMember',
    isAuth,
    getAllMemberList
 );

//  get only active memebr
router.get(
    '/get-active-members',
    isAuth,
    getAllActiveMembers
 );

// get single member profile 
 router.get(
    '/:userId/get-single-member-profile',
    getSingleMemberProfile
 );

//  get latest member profile
 router.get(
    '/getLatestMemberProfile',
    isAuth,
    getLatestMemberProfile
 );

//  get member transaction 
router.get('/member-transactions',isAuth,getMemberTransctionList);
router.get('/member-transactionsv2',isAuth,getMemberTransactionListV2);

//  get transaction of single member
router.get('/:memberId/member-wise-transaction',getTransactionsByMember);

// create a Multi transaction 
router.post('/create-transaction',isAuth,saveMultiTransaction);

// get next MemberID
router.get('/next-id',isAuth, getNextMemberId);

module.exports = router