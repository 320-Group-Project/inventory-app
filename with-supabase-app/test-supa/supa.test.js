import { createClient } from '@supabase/supabase-js'
import { create } from 'domain';

let url= 'http://127.0.0.1:54321'
let publishableKey = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH'

//All permisions service client
const service = createClient(
  'http://127.0.0.1:54321',
  'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz'
)

//All Clients
let ownerClient;
let memberClient;
let noClubClient;
let adminClient;

let ownerUID;
let otherClubItemCatID = 99
let otherClubItemID = 99

let memberUID;
let noClubUID;
let adminUID;

let itemCatID = 1
let clubID = 1
let otherClubID = 2
beforeAll(async () => {

  //OWNER client
  ownerClient = createClient(url, publishableKey);
  await ownerClient.auth.signUp({ email: "owner@gmail.com", password: "password123" });
  const { data: ownerData} = await ownerClient.auth.signInWithPassword({ email: "owner@gmail.com", password: "password123" });
  ownerUID = ownerData.user.id;

  //Test Club
  const { error: clubErr } = await ownerClient
    .from('Club')
    .insert([{ club_id: clubID, name: "Test Club" }]);
  if (clubErr) throw clubErr;

  //Test Club 2
  const { error: clubErr2 } = await ownerClient
    .from('Club')
    .insert([{ club_id: otherClubID, name: "Wrong Club" }]);
  if (clubErr2) throw clubErr2;

  // Cross-club test data
  const { error: otherCatErr } = await service
    .from('item_category')
    .insert([{ item_cat_id: 99, club_id: otherClubID, name: "otherClubCat", quantity: 5 }]);
  if (otherCatErr) throw otherCatErr;

  const { error: otherItemErr } = await service
    .from("item")
    .insert([{ item_id: 99, name: "otherClubItem", cat_id: 99 }]);
  if (otherItemErr) throw otherItemErr;

  //ADMIN client
  adminClient = createClient(url, publishableKey);
  await adminClient.auth.signUp({ email: "admin@gmail.com", password: "password123" });
  const { data:adminData, error: adminError } = await adminClient.auth.signInWithPassword({ 
    email: "admin@gmail.com", 
    password: "password123" 
  });
  if (adminError) throw adminError;
  adminUID = adminData.user.id;
  const { error: adRoleErr } = await service
    .from('Role')
    .insert([{ role: 'Admin', club_id: clubID, UID: adminUID }]);
  if (adRoleErr) throw adRoleErr;

  // MEMBER client
  memberClient = createClient(url, publishableKey);
  await memberClient.auth.signUp({ email: "member@gmail.com", password: "password123" });
  const { data, error: signInErr } = await memberClient.auth.signInWithPassword({ 
    email: "member@gmail.com", 
    password: "password123" 
  });
  if (signInErr) throw signInErr;
  memberUID = data.user.id;
  //Member Role
  const { error: roleErr } = await service
    .from('Role')
    .insert([{ role: 'member', club_id: clubID, UID: memberUID }]);
  if (roleErr) throw roleErr;

  //No Club Client
  noClubClient = createClient(url, publishableKey);
  await noClubClient.auth.signUp({
    email: "noClub@gmail.com",
    password: "password123"
  });
  const {data: nonClub, error: errNon} = await noClubClient.auth.signInWithPassword({
    email: "noClub@gmail.com",
    password: "password123"
  });
  if (errNon) throw errNon;
  noClubUID = nonClub.user.id;


  //Filler test item category
  const {error: itemCatErr} = await service
  .from('item_category')
  .insert([{item_cat_id: itemCatID, club_id: clubID, name:"test", quantity: 1}])
  .select()
  if (itemCatErr) throw itemCatErr;

  //Filler test item
  const {error:itemErr} = await service
    .from("item")
    .insert([{item_id: 20, name:"testItem", cat_id: 1}])   
    .select();
  if (itemErr) throw itemErr;

});



describe("general club members follow rls", () =>{
  test("member can see club items", async () => {
    const { data, error } = await memberClient
      .from('item_category')
      .select('*')
      .eq('club_id', clubID);

    expect(error).toBeNull();
    expect(data.length).toBeGreaterThan(0);
  });

  test("member can see items", async () => {
    const { data, error } = await memberClient
      .from('item')
      .select('*')
      .eq('cat_id', itemCatID);
    expect(error).toBeNull();
    expect(data.length).toBeGreaterThan(0);
  });

  test("Club member can see club roles", async () => {
    const { data, error } = await memberClient
      .from('Role')
      .select('*')
      .eq('club_id', 1)

    expect(error).toBeNull();
    expect(data.length).toBeGreaterThan(0);
  })

  test("Club member can't change club roles", async () =>{
    const { data } = await memberClient
      .from('Role')
      .update({ role: 'owner' })
      .eq('UID', memberUID)
      .select();
    expect(data == null || data.length === 0).toBe(true);

  })

  test("Club member can't change items categories", async () =>{
    const { data } = await memberClient
      .from('item_category')
      .update({ name: 'hacked' })
      .eq('item_cat_id', itemCatID)
      .select();
    expect(data == null || data.length === 0).toBe(true);
  })
  




  test("Club member can't add item categories", async () => {
    const { data } = await memberClient
      .from('item_category')
      .insert([{ item_cat_id: 50, club_id: clubID, name: "memberHack", quantity: 1 }])
      .select();
    expect(data == null || data.length === 0).toBe(true);  
  });

  test("Club member can't delete item categories", async () => {
    const { data } = await memberClient
      .from('item_category')
      .delete()
      .eq('item_cat_id', itemCatID)
      .select();
    expect(data == null || data.length === 0).toBe(true);
  });

  test("Club member can't add items", async () => {
    const { data } = await memberClient
      .from('item')
      .insert([{ item_id: 51, name: "memberHackItem", cat_id: itemCatID }])
      .select();
    expect(data == null || data.length === 0).toBe(true);
  });

  test("Club member can't delete items", async () => {
    const { data } = await memberClient
      .from('item')
      .delete()
      .eq('item_id', 20)
      .select();
    expect(data == null || data.length === 0).toBe(true);
  });
})

describe("Non-club members follow rls", ()=>{
  test("authorized user can view roles", async () => {
    const {data, error} = await noClubClient
    .from('Role')
    .select('*')
    .limit(1)
    expect(error).toBeNull();
    expect(data).not.toHaveLength(0);
  })
  test("authorized user can make clubs", async () =>{
    const {data, error} = await noClubClient
    .from('Club')
    .insert([{ club_id: 67, name: "Test authorized User" }])
    .select()
  if (error) throw error;
  expect(error).toBeNull();
  expect(data).not.toHaveLength(0);

  })
})


describe("club admins follow rls", () =>{
  test("Club admins can add items", async ()=>{
    const {data, error} = await adminClient
    .from("item")
    .insert([{item_id: 1, name:"testAdmin", cat_id: 1}])   
    .select();
    expect(error).toBeNull();
    expect(data).not.toHaveLength(0);
  })




  test("Club admins can edit items", async () => {
    await service.from("item").insert([{ item_id: 30, name: "adminEditTarget", cat_id: itemCatID }]);
    const { data, error } = await adminClient
      .from("item")
      .update({ name: "adminEdited" })
      .eq('item_id', 30)
      .select();
    expect(error).toBeNull();
    expect(data).not.toHaveLength(0);
  });

  test("Club admins can delete items", async () => {
    await service.from("item").insert([{ item_id: 31, name: "adminDeleteTarget", cat_id: itemCatID }]);
    const { data, error } = await adminClient
      .from("item").delete().eq('item_id', 31).select();
    expect(error).toBeNull();
    expect(data).not.toHaveLength(0);
  });

  test("Club admins can add item categories", async () => {
    const { data, error } = await adminClient
      .from('item_category')
      .insert([{ item_cat_id: 10, club_id: clubID, name: "adminCat", quantity: 3 }])
      .select();
    expect(error).toBeNull();
    expect(data).not.toHaveLength(0);
  });

  test("Club admins can edit item categories", async () => {
    const { data, error } = await adminClient
      .from('item_category')
      .update({ name: "adminCatEdited" })
      .eq('item_cat_id', itemCatID)
      .select();
    expect(error).toBeNull();
    expect(data).not.toHaveLength(0);
  });

  test("Club admins can delete item categories", async () => {
    await service.from('item_category').insert([{ item_cat_id: 11, club_id: clubID, name: "adminDeleteCat", quantity: 1 }]);
    const { data, error } = await adminClient
      .from('item_category').delete().eq('item_cat_id', 11).select();
    expect(error).toBeNull();
    expect(data).not.toHaveLength(0);
  });

  test("Club admins can't add other club items", async () => {
    const { data, error } = await adminClient
      .from("item")
      .insert([{ item_id: 60, name: "adminCrossClubItem", cat_id: otherClubItemCatID }])
      .select();
    console.log("Admin hack error: ", error)
    expect(data == null || data.length === 0).toBe(true);    
  });

  test("Club admins can't change other club's item categories", async () => {
    const { data, error } = await adminClient
      .from('item_category')
      .update({ name: "adminHacked" })
      .eq('item_cat_id', otherClubItemCatID)
      .select();
    console.log("Admin hack error cat: ", error)
    expect(data == null || data.length === 0).toBe(true);
  });
})




describe("Club owners follow rls", ()=>{
  test("Club owners can add items", async ()=>{
    const {data, error} = await adminClient
    .from("item")
    .insert([{item_id: 2, name:"testAdmin", cat_id: 1}])   
    .select();
    expect(error).toBeNull();
    expect(data).not.toHaveLength(0);
  })




  test("Club owners can edit items", async () => {
    await service.from("item").insert([{ item_id: 40, name: "ownerEditTarget", cat_id: itemCatID }]);
    const { data, error } = await ownerClient
      .from("item").update({ name: "ownerEdited" }).eq('item_id', 40).select();
    expect(error).toBeNull();
    expect(data).not.toHaveLength(0);
  });

  test("Club owners can delete items", async () => {
    await service.from("item").insert([{ item_id: 41, name: "ownerDeleteTarget", cat_id: itemCatID }]);
    const { data, error } = await ownerClient
      .from("item").delete().eq('item_id', 41).select();
    expect(error).toBeNull();
    expect(data).not.toHaveLength(0);
  });

  test("Club owners can add item categories", async () => {
    const { data, error } = await ownerClient
      .from('item_category')
      .insert([{ item_cat_id: 12, club_id: clubID, name: "ownerCat", quantity: 2 }])
      .select();
    expect(error).toBeNull();
    expect(data).not.toHaveLength(0);
  });

  test("Club owners can edit item categories", async () => {
    const { data, error } = await ownerClient
      .from('item_category')
      .update({ name: "ownerCatEdited" }).eq('item_cat_id', itemCatID).select();
    expect(error).toBeNull();
    expect(data).not.toHaveLength(0);
  });

  test("Club owners can delete item categories", async () => {
    await service.from('item_category').insert([{ item_cat_id: 13, club_id: clubID, name: "ownerDeleteCat", quantity: 1 }]);
    const { data, error } = await ownerClient
      .from('item_category').delete().eq('item_cat_id', 13).select();
    expect(error).toBeNull();
    expect(data).not.toHaveLength(0);
  });

  test("Club owners can't change other club items", async () => {
    const { data } = await ownerClient
      .from('item').update({ name: "ownerHacked" }).eq('item_id', otherClubItemID).select();
    expect(data == null || data.length === 0).toBe(true);
  });

  test("Club owners can't change other item categories", async () => {
    const { data } = await ownerClient
      .from('item_category').update({ name: "ownerHackedCat" }).eq('item_cat_id', otherClubItemCatID).select();
    expect(data == null || data.length === 0).toBe(true);
  });

  test("Club owner can only change roles of other members of same club", async () => {
    const { data: otherUser } = await service.auth.admin.createUser({ email: "otherMember@gmail.com", password: "password123" });
    const otherMemberUID = otherUser.user.id;
    await service.from('Role').insert([{ role: 'member', club_id: otherClubID, UID: otherMemberUID }]);

    const { data } = await ownerClient
      .from('Role').update({ role: 'Admin' }).eq('UID', otherMemberUID).eq('club_id', otherClubID).select();
    expect(data == null || data.length === 0).toBe(true);
  });
})


















