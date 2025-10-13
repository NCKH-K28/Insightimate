// type UserPublic = { id: string; name: string; email?: string; avatar?: string | null };

// type AddTeamMemberInputProps = {
//   params: { workspaceId: string };
//   onSelect?: (users: UserPublic[]) => void;
// };
// const AddTeamMemberInput = ({ params }: AddTeamMemberInputProps) => {
//   const { data: wsMembers, isPending } = useQuery(listWsMembersQueryOptions(params));

//   const [memberSearchText, setMemberSearchText] = React.useState('');

//   const wsMembersFiltered = React.useMemo(() => {
//     if (!memberSearchText) return [];
//     const filtered = wsMembers?.filter((mem) => {
//       if (!mem.user) return false;
//       return (
//         mem.user.name.toLowerCase().includes(memberSearchText.toLowerCase()) ||
//         mem.user.email?.toLowerCase().includes(memberSearchText.toLowerCase())
//       );
//     });
//     return sortBy(filtered, [
//       ({ user }) => user?.name.toLowerCase(),
//       ({ user }) => user?.email?.toLowerCase() || '',
//     ]).slice(0, Math.min(3, filtered?.length ?? 0));
//   }, [wsMembers, memberSearchText]);

//   const [selectedUsers, setSelectedUsers] = React.useState<UserPublic[]>([]);

//   return (
//     <div className='space-y-2'>
//       <Command className='overflow-hidden rounded-t-none border-t bg-transparent'>
//         <CommandInput
//           placeholder='Search user...'
//           value={memberSearchText}
//           onValueChange={(text) => setMemberSearchText(text)}
//         />
//         <CommandList>
//           <CommandEmpty>{isPending ? 'Loading users...' : 'No users found.'}</CommandEmpty>
//           <CommandGroup>
//             {wsMembersFiltered.map(({ user }) => (
//               <CommandItem
//                 key={user.email}
//                 value={`${user.name} (${user.email})`}
//                 data-active={selectedUsers.find((u) => u.id === user.id) != null}
//                 className='data-[active=true]:opacity-50'
//                 onSelect={() => {
//                   setSelectedUsers((prev) => {
//                     if (prev.find((u) => u.id === user.id) != null) {
//                       return prev.filter((u) => u.id !== user.id);
//                     } else return [...prev, user];
//                   });
//                 }}
//               >
//                 <Avatar className='border'>
//                   <AvatarImage src={user.avatar ?? undefined} alt='Image' />
//                   <AvatarFallback>{user.name[0]}</AvatarFallback>
//                 </Avatar>
//                 <div className='ml-2'>
//                   <p className='text-sm leading-none font-medium'>{user.name}</p>
//                   <p className='text-muted-foreground text-sm'>{user.email}</p>
//                 </div>
//                 {selectedUsers.find((u) => u.id === user.id) != null ? (
//                   <CheckIcon className='text-primary ml-auto flex size-4' />
//                 ) : null}
//               </CommandItem>
//             ))}
//           </CommandGroup>
//         </CommandList>
//       </Command>

//       <div>
//         <div className='flex -space-x-2 overflow-hidden'>
//           {selectedUsers.map((user) => (
//             <Tooltip key={user.id}>
//               <TooltipTrigger asChild>
//                 <Avatar key={user.email} className='relative inline-block border'>
//                   <AvatarImage src={user.avatar ?? undefined} />
//                   <AvatarFallback>{user.name[0]}</AvatarFallback>
//                   <XIcon
//                     className='absolute inset-0 opacity-0 hover:opacity-100 bg-black/50 text-white cursor-pointer m-auto rounded-full p-1'
//                     onClick={() => {
//                       setSelectedUsers((prev) => prev.filter((u) => u.id !== user.id));
//                     }}
//                   />
//                 </Avatar>
//               </TooltipTrigger>
//               <TooltipContent>
//                 <p className='max-w-xs'>{user.name}</p>
//                 <p className='text-muted-foreground text-sm'>{user.email}</p>
//               </TooltipContent>
//             </Tooltip>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };
